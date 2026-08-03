<?php

namespace App\Domains\Media\Services;

use App\Enums\MediaType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

final class MediaService
{
    public function determineType(
        string $mimeType
    ): MediaType {
        return match (true) {
            str_starts_with($mimeType, 'image/') =>
                MediaType::IMAGE,

            str_starts_with($mimeType, 'video/') =>
                MediaType::VIDEO,

            $mimeType === 'application/pdf' =>
                MediaType::DOCUMENT,

            default =>
                throw new InvalidArgumentException(
                    'Unsupported media type.'
                ),
        };
    }

    public function store(
        UploadedFile $file,
        string $disk = 'public'
    ): string {
        return $file->store(
            'media',
            $disk
        );
    }

    public function delete(
        string $disk,
        string $path
    ): void {
        Storage::disk($disk)->delete($path);
    }
}
