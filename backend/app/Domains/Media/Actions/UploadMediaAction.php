<?php

namespace App\Domains\Media\Actions;

use App\Domains\Media\Repositories\MediaRepositoryInterface;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Events\MediaUploaded;
use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class UploadMediaAction
{
    public function __construct(
        private readonly MediaRepositoryInterface $media,
        private readonly MediaService $service,
    ) {}

   public function execute(
    UploadedFile $file,
    string $mediableType,
    string $mediableId,
    int $uploadedBy,
    string $disk = 'public',
): Media {
    $path = $this->service->store(
        $file,
        $disk
    );

    try {
        return DB::transaction(function () use (
            $file,
            $mediableType,
            $mediableId,
            $uploadedBy,
            $disk,
            $path,
        ) {
            $media = $this->media->create([
                'uploaded_by' => $uploadedBy,
                'disk' => $disk,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'filename' => basename($path),
                'mime_type' => $file->getMimeType(),
                'extension' => $file->extension(),
                'size' => $file->getSize(),
                'type' => $this->service->determineType(
                    $file->getMimeType()
                ),
                'mediable_type' => $mediableType,
                'mediable_id' => $mediableId,
            ]);

            event(new MediaUploaded($media));

            return $media;
        });
    } catch (\Throwable $exception) {
        $this->service->delete(
            $disk,
            $path
        );

        throw $exception;
    }
}
}
