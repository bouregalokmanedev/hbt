<?php

namespace App\Http\Controllers;

use App\Domains\Courses\Services\CourseAccessService;
use App\Domains\Lessons\Services\LessonAccessService;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Media;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

final class MediaStreamController extends Controller
{
    public function __construct(
        private readonly CourseAccessService $courseAccess,
        private readonly LessonAccessService $lessonAccess,
    ) {
    }

    public function __invoke(
        Request $request,
        Media $media
    ): Response {
        /*
         * Two ways to access:
         * 1. Signed URL issued with the lesson/course payload (native
         *    <video>/<a> requests carry no Bearer token) — enrollment
         *    was already enforced when the parent payload was loaded.
         * 2. Authenticated request from an admin, the course instructor,
         *    an enrolled student, or a preview lesson.
         */
        if (! $request->hasValidSignature()) {
            $user = $request->user();
            abort_unless($user, 401);
            abort_unless($this->canStream($user, $media), 403);
        }

        abort_unless(
            str_starts_with($media->mime_type, 'video/')
            || str_starts_with($media->mime_type, 'image/')
            || str_starts_with($media->mime_type, 'application/pdf')
            || str_starts_with($media->mime_type, 'text/'),
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
                        'private, max-age=0, must-revalidate',

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
         * Non-video files (images, PDFs, documents): stream the full body.
         */
        if (! str_starts_with($media->mime_type, 'video/')) {
            return response()->stream(function () use ($disk, $media): void {
                $stream = $disk->readStream($media->path);
                if ($stream === false) {
                    return;
                }
                try {
                    while (! feof($stream)) {
                        $buffer = fread($stream, 1024 * 1024);
                        if ($buffer === false || $buffer === '') {
                            break;
                        }
                        echo $buffer;
                        if (function_exists('ob_flush')) {
                            @ob_flush();
                        }
                        flush();
                    }
                } finally {
                    fclose($stream);
                }
            }, 200, [
                'Content-Type' => $media->mime_type,
                'Content-Length' => (string) $size,
                'Cache-Control' => 'private, max-age=0, must-revalidate',
                'Content-Disposition' => 'inline; filename="' . addslashes($media->filename) . '"',
            ]);
        }

        /*
         * No Range header — full video.
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
                    'private, max-age=0, must-revalidate',

                'Content-Disposition' =>
                        'inline; filename="' .
                        addslashes(
                            $media->filename
                        ) .
                        '"',
            ]
        );
    }

    private function canStream(User $user, Media $media): bool
    {
        if ($user->hasAnyRole(['Admin', 'Super Admin'])) {
            return true;
        }

        $mediable = $media->mediable;

        /*
         * Signed URLs already proved access when the parent payload was
         * rendered. For direct authenticated requests we re-use the exact
         * same gates as the lesson player so a guessed media id can never
         * expose content from a draft lesson or another learner's course.
         */
        if ($mediable instanceof Lesson) {
            $mediable->loadMissing('section.course');

            if ($mediable->section?->course?->instructor_id === $user->id) {
                return true;
            }

            return $this->lessonAccess->canAccess($user, $mediable);
        }

        if ($mediable instanceof Course) {
            return $mediable->instructor_id === $user->id
                || $this->courseAccess->canBrowse($user, $mediable);
        }

        return false;
    }
}