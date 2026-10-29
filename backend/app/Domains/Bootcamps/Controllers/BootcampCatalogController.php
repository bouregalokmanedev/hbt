<?php

namespace App\Domains\Bootcamps\Controllers;

use App\Domains\Bootcamps\Requests\StoreBootcampRegistrationRequest;
use App\Domains\Bootcamps\Resources\BootcampRegistrationResource;
use App\Domains\Bootcamps\Resources\BootcampResource;
use App\Domains\Bootcamps\Resources\BootcampScheduleResource;
use App\Enums\Bootcamps\BootcampStatus;
use App\Enums\Courses\Difficulty;
use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\BootcampSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

final class BootcampCatalogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 12), 1), 48);

        $query = Bootcamp::query()
            ->where('status', BootcampStatus::PUBLISHED)
            ->with([
                'instructor',
                'schedules' => fn ($schedules) => $schedules
                    ->whereDate('ends_at', '>=', today())
                    ->orderBy('starts_at'),
            ])
            ->withCount('registrations')
            ->latest('published_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('level')) {
            $level = Difficulty::tryFrom(
                $request->string('level')->toString()
            );

            abort_unless($level !== null, 422, 'Invalid level filter.');

            $query->where('level', $level->value);
        }

        if ($request->filled('location')) {
            $query->where(
                'location',
                'like',
                '%'.$request->string('location')->toString().'%'
            );
        }

        return BootcampResource::collection($query->paginate($perPage));
    }

    public function show(Bootcamp $bootcamp): BootcampResource
    {
        abort_unless(
            $bootcamp->status === BootcampStatus::PUBLISHED,
            404
        );

        $bootcamp
            ->load([
                'instructor',
                'schedules' => fn ($schedules) => $schedules
                    ->whereDate('ends_at', '>=', today())
                    ->orderBy('starts_at'),
                'sections.lessons',
            ])
            ->loadCount('registrations');

        return new BootcampResource($bootcamp);
    }

    public function calendar(Request $request)
    {
        $from = $request->date('from') ?: today();
        $to = $request->date('to') ?: today()->addMonths(6);

        $schedules = BootcampSchedule::query()
            ->whereHas(
                'bootcamp',
                fn ($query) => $query->where(
                    'status',
                    BootcampStatus::PUBLISHED
                )
            )
            ->with('bootcamp')
            ->whereDate('ends_at', '>=', $from->toDateString())
            ->whereDate('starts_at', '<=', $to->toDateString())
            ->orderBy('starts_at')
            ->get();

        return BootcampScheduleResource::collection($schedules);
    }

    public function brochure(Bootcamp $bootcamp)
    {
        abort_unless(
            $bootcamp->status === BootcampStatus::PUBLISHED
                && filled($bootcamp->brochure_path),
            404
        );

        $disk = Storage::disk('local');

        abort_unless($disk->exists($bootcamp->brochure_path), 404);

        return $disk->download(
            $bootcamp->brochure_path,
            $bootcamp->brochure_original_name ?: 'bootcamp-brochure.pdf'
        );
    }

    public function register(
        StoreBootcampRegistrationRequest $request,
        Bootcamp $bootcamp,
    ) {
        abort_unless(
            $bootcamp->status === BootcampStatus::PUBLISHED,
            404
        );

        $validated = $request->validated();

        $schedule = $bootcamp->schedules()
            ->whereKey($validated['schedule_id'])
            ->first();

        if (! $schedule) {
            throw ValidationException::withMessages([
                'schedule_id' => 'The selected date does not belong to this bootcamp.',
            ]);
        }

        if ($schedule->ends_at->lt(today())) {
            throw ValidationException::withMessages([
                'schedule_id' => 'The selected bootcamp session has already ended.',
            ]);
        }

        $email = strtolower(trim((string) $validated['email']));

        $alreadyRegistered = $bootcamp->registrations()
            ->where('bootcamp_schedule_id', $schedule->id)
            ->where('email', $email)
            ->exists();

        if ($alreadyRegistered) {
            throw ValidationException::withMessages([
                'email' => 'This email is already registered for the selected date.',
            ]);
        }

        $registration = $bootcamp->registrations()->create([
            'bootcamp_schedule_id' => $schedule->id,
            'first_name' => trim((string) $validated['first_name']),
            'last_name' => trim((string) $validated['last_name']),
            'email' => $email,
            'phone' => trim((string) $validated['phone']),
            'site' => $validated['site'],
            'payment_method' => $validated['payment_method'],
            'terms_accepted' => true,
            'status' => 'pending',
        ]);

        return (new BootcampRegistrationResource(
            $registration->load('schedule')
        ))->response()->setStatusCode(201);
    }
}
