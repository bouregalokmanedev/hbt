<?php

namespace App\Http\Controllers;

use App\Domains\Media\Actions\UploadMediaAction;
use App\Domains\Media\Requests\UploadMediaRequest;
use App\Domains\Media\Resources\MediaResource;
use App\Domains\Media\Actions\DeleteMediaAction;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

final class MediaController extends Controller
{
    public function __construct(
        private readonly UploadMediaAction $uploadMedia,
        private readonly DeleteMediaAction $deleteMedia,
    ) {}

    public function store(
        UploadMediaRequest $request
    ): JsonResponse {
        $validated = $request->validated();

        Gate::authorize(
            'create',
            [
                Media::class,
                $validated['mediable_type'],
                $validated['mediable_id'],
            ]
        );

        $media = $this->uploadMedia->execute(
            file: $validated['file'],
            mediableType: $validated['mediable_type'],
            mediableId: $validated['mediable_id'],
            uploadedBy: $request->user()->id,
        );

        return (new MediaResource($media))
            ->response()
            ->setStatusCode(201);
    }
    public function show(
    Media $media
): MediaResource {
    Gate::authorize(
        'view',
        $media
    );

    return new MediaResource($media);
}
     public function destroy(
        Media $media
    ): JsonResponse {
        Gate::authorize('delete', $media);

        $this->deleteMedia->execute($media);

        return response()->json(
            status: 204
        );
    }


}
