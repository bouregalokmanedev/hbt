<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

final class MediaStreamController extends Controller
{
    public function __invoke(
        Request $request,
        Media $media
    ): Response {
        // Make sure this is actually a video.
        abort_unless(
            str_starts_with($media->mime_type, 'video/'),
            404
        );

        $disk = Storage::disk($media->disk);

        // Make sure the physical file exists.
        abort_unless(
            $disk->exists($media->path),
            404
        );

        $size = $disk->size($media->path);

        abort_if(
            $size <= 0,
            404
        );

        $start = 0;
        $end = $size - 1;

        $range = $request->header('Range');

        /*
         * Handle HTTP Range requests.
         *
         * Examples:
         *
         * Range: bytes=0-999
         * Range: bytes=1000-1999
         * Range: bytes=1000-
         * Range: bytes=-1000
         */
        if (
            $range &&
            preg_match(
                '/bytes=(\d*)-(\d*)/',
                $range,
                $matches
            )
        ) {
            $rangeStart = $matches[1] ?? '';
            $rangeEnd = $matches[2] ?? '';

            // bytes=-1000
            if ($rangeStart === '' && $rangeEnd !== '') {
                $suffixLength = (int) $rangeEnd;

                if ($suffixLength <= 0) {
                    abort(416);
                }

                $start = max(
                    0,
                    $size - $suffixLength
                );

                $end = $size - 1;
            } else {
                // bytes=1000-
                if ($rangeStart !== '') {
                    $start = (int) $rangeStart;
                }

                // bytes=1000-1999
                if ($rangeEnd !== '') {
                    $end = (int) $rangeEnd;
                }

                $end = min(
                    $end,
                    $size - 1
                );
            }

            abort_if(
                $start < 0 ||
                $start >= $size ||
                $start > $end,
                416
            );

            $length = $end - $start + 1;

            return response()->stream(
                function () use (
                    $disk,
                    $media,
                    $start,
                    $length
                ): void {
                    $stream = $disk->readStream(
                        $media->path
                    );

                    if ($stream === false) {
                        return;
                    }

                    try {
                        fseek(
                            $stream,
                            $start
                        );

                        $remaining = $length;

                        while (
                            $remaining > 0 &&
                            !feof($stream)
                        ) {
                            $chunkSize = min(
                                1024 * 1024,
                                $remaining
                            );

                            $buffer = fread(
                                $stream,
                                $chunkSize
                            );

                            if (
                                $buffer === false ||
                                $buffer === ''
                            ) {
                                break;
                            }

                            echo $buffer;

                            $remaining -= strlen(
                                $buffer
                            );

                            if (
                                function_exists(
                                    'ob_flush'
                                )
                            ) {
                                @ob_flush();
                            }

                            flush();
                        }
                    } finally {
                        fclose($stream);
                    }
                },
                206,
                [
                    'Content-Type' =>
                        $media->mime_type,

                    'Content-Length' =>
                        (string) $length,

                    'Content-Range' =>
                        "bytes {$start}-{$end}/{$size}",

                    'Accept-Ranges' =>
                        'bytes',

                    'Cache-Control' =>
                        'public, max-age=3600',

                    'Content-Disposition' =>
                        'inline; filename="' .
                        addslashes(
                            $media->filename
                        ) .
                        '"',
                ]
            );
        }

        /*
         * No Range header.
         *
         * Return the complete video.
         */
        return response()->stream(
            function () use (
                $disk,
                $media
            ): void {
                $stream = $disk->readStream(
                    $media->path
                );

                if ($stream === false) {
                    return;
                }

                try {
                    while (!feof($stream)) {
                        $buffer = fread(
                            $stream,
                            1024 * 1024
                        );

                        if (
                            $buffer === false ||
                            $buffer === ''
                        ) {
                            break;
                        }

                        echo $buffer;

                        if (
                            function_exists(
                                'ob_flush'
                            )
                        ) {
                            @ob_flush();
                        }

                        flush();
                    }
                } finally {
                    fclose($stream);
                }
            },
            200,
            [
                'Content-Type' =>
                    $media->mime_type,

                'Content-Length' =>
                    (string) $size,

                'Accept-Ranges' =>
                    'bytes',

                'Cache-Control' =>
                    'public, max-age=3600',

                'Content-Disposition' =>
                    'inline; filename="' .
                    addslashes(
                        $media->filename
                    ) .
                    '"',
            ]
        );
    }
}