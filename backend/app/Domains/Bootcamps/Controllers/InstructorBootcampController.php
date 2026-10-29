<?php

namespace App\Domains\Bootcamps\Controllers;

use App\Domains\Bootcamps\Requests\CreateBootcampRequest;
use App\Domains\Bootcamps\Requests\UpdateBootcampRequest;
use App\Domains\Bootcamps\Requests\UploadBootcampBrochureRequest;
use App\Domains\Bootcamps\Requests\UploadBootcampMediaRequest;
use App\Domains\Bootcamps\Resources\BootcampResource;
use App\Domains\Bootcamps\Services\BootcampService;
use App\Enums\Bootcamps\BootcampStatus;
use App\Enums\Courses\Difficulty;
use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class InstructorBootcampController extends Controller
{
    /**
     * Public bootcamp media columns and their allowed upload rules.
     *
     * @var array<string, array{accept: string, label: string}>
     */
    private const MEDIA_TYPES = [
        'thumbnail' => [
            'accept' => 'image',
            'label' => 'thumbnail',
        ],
        'cover_image' => [
            'accept' => 'image',
            'label' => 'cover image',
        ],
        'preview_video' => [
            'accept' => 'video',
            'label' => 'preview video',
        ],
    ];

    public function __construct(
        private readonly BootcampService $bootcamps,
    ) {}

    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 100);

        $query = Bootcamp::query()
            ->where('instructor_id', (int) auth()->id())
            ->with([
                'instructor',
                'schedules' => fn ($schedules) => $schedules->orderBy('starts_at'),
            ])
            ->withCount('registrations')
            ->latest('created_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $status = BootcampStatus::tryFrom(
                $request->string('status')->toString()
            );

            abort_unless($status !== null, 422, 'Invalid status filter.');

            $query->where('status', $status->value);
        }

        if ($request->filled('level')) {
            $level = Difficulty::tryFrom(
                $request->string('level')->toString()
            );

            abort_unless($level !== null, 422, 'Invalid level filter.');

            $query->where('level', $level->value);
        }

        return BootcampResource::collection($query->paginate($perPage));
    }

    public function show(Bootcamp $bootcamp): BootcampResource
    {
        // The editor is a management surface: only the owner (or an admin)
        // should see a bootcamp here, even when it is published.
        $this->authorize('update', $bootcamp);

        return new BootcampResource($this->fullBootcamp($bootcamp));
    }

    public function store(
        CreateBootcampRequest $request,
    ): JsonResponse {
        $bootcamp = $this->bootcamps->create(
            $request->validated(),
            (int) auth()->id()
        );

        return (new BootcampResource($this->fullBootcamp($bootcamp)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateBootcampRequest $request,
        Bootcamp $bootcamp,
    ): BootcampResource {
        $this->authorize('update', $bootcamp);

        $bootcamp = $this->bootcamps->update(
            $bootcamp,
            $request->validated()
        );

        return new BootcampResource($this->fullBootcamp($bootcamp));
    }

    public function destroy(Bootcamp $bootcamp): JsonResponse
    {
        $this->authorize('delete', $bootcamp);

        $this->deleteStoredMedia($bootcamp);

        $bootcamp->delete();

        return response()->json([
            'message' => 'Bootcamp deleted successfully.',
        ]);
    }

    public function publish(Bootcamp $bootcamp): BootcampResource
    {
        $this->authorize('publish', $bootcamp);

        $bootcamp->update([
            'status' => BootcampStatus::PUBLISHED,
            'published_at' => $bootcamp->published_at ?? now(),
        ]);

        return new BootcampResource(
            $this->fullBootcamp($bootcamp->refresh())
        );
    }

    public function unpublish(Bootcamp $bootcamp): BootcampResource
    {
        $this->authorize('publish', $bootcamp);

        $bootcamp->update([
            'status' => BootcampStatus::DRAFT,
            'published_at' => null,
        ]);

        return new BootcampResource(
            $this->fullBootcamp($bootcamp->refresh())
        );
    }

    public function uploadBrochure(
        UploadBootcampBrochureRequest $request,
        Bootcamp $bootcamp,
    ): BootcampResource {
        $this->authorize('update', $bootcamp);

        $file = $request->file('brochure');
        $originalName = $file->getClientOriginalName();
        $filename = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));
        $filename = ($filename !== '' ? $filename : 'bootcamp-brochure')
            .'-'.Str::lower(Str::random(8))
            .'.pdf';

        $disk = Storage::disk('local');

        if (filled($bootcamp->brochure_path)) {
            $disk->delete($bootcamp->brochure_path);
        }

        $path = $file->storeAs('bootcamp-brochures', $filename, 'local');

        $bootcamp->update([
            'brochure_path' => $path,
            'brochure_original_name' => $originalName,
        ]);

        return new BootcampResource(
            $this->fullBootcamp($bootcamp->refresh())
        );
    }

    public function uploadMedia(
        UploadBootcampMediaRequest $request,
        Bootcamp $bootcamp,
        string $type,
    ): BootcampResource {
        $this->authorize('update', $bootcamp);

        abort_unless(
            array_key_exists($type, self::MEDIA_TYPES),
            404
        );

        $file = $request->file('file');
        $extension = $file->guessExtension() ?: (
            $type === 'preview_video' ? 'mp4' : 'jpg'
        );

        $filename = $type
            .'-'.Str::lower(Str::random(12))
            .'.'.$extension;

        $disk = Storage::disk('public');

        if (filled($bootcamp->{$type})) {
            $disk->delete($bootcamp->{$type});
        }

        $path = $file->storeAs(
            "bootcamps/{$bootcamp->id}",
            $filename,
            'public'
        );

        $bootcamp->update([$type => $path]);

        return new BootcampResource(
            $this->fullBootcamp($bootcamp->refresh())
        );
    }

    public function deleteMedia(
        Bootcamp $bootcamp,
        string $type,
    ): BootcampResource {
        $this->authorize('update', $bootcamp);

        abort_unless(
            array_key_exists($type, self::MEDIA_TYPES),
            404
        );

        $this->deleteMediaFile($bootcamp, $type);

        $bootcamp->update([$type => null]);

        return new BootcampResource(
            $this->fullBootcamp($bootcamp->refresh())
        );
    }

    private function deleteStoredMedia(Bootcamp $bootcamp): void
    {
        foreach (array_keys(self::MEDIA_TYPES) as $type) {
            $this->deleteMediaFile($bootcamp, $type);
        }

        if (filled($bootcamp->brochure_path)) {
            Storage::disk('local')->delete($bootcamp->brochure_path);
        }
    }

    private function deleteMediaFile(Bootcamp $bootcamp, string $type): void
    {
        if (blank($bootcamp->{$type})) {
            return;
        }

        Storage::disk('public')->delete($bootcamp->{$type});
    }

    private function fullBootcamp(Bootcamp $bootcamp): Bootcamp
    {
        return $bootcamp
            ->load([
                'instructor',
                'schedules' => fn ($schedules) => $schedules->orderBy('starts_at'),
                'sections.lessons',
            ])
            ->loadCount('registrations');
    }
}
