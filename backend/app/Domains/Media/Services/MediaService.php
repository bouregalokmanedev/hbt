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

            in_array($mimeType, [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ], true) =>
                MediaType::DOCUMENT,

            default =>
                throw new InvalidArgumentException(
                    'Unsupported media type.'
                ),
        };
    }

public function store(
    UploadedFile $file,
    string $disk = 'public',
    ?string $directory = null,
): string {
    $directory ??= match (true) {
        str_starts_with($file->getMimeType(), 'video/') => 'lessons',
        str_starts_with($file->getMimeType(), 'image/') => 'images',
        in_array($file->getMimeType(), [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ], true) => 'documents',
        default => 'media',
    };

    return $file->store($directory, $disk);
}

    public function delete(
        string $disk,
        string $path
    ): void {
        Storage::disk($disk)->delete($path);
    }
}
