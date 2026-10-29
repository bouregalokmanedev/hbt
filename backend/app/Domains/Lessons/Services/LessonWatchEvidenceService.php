<?php

namespace App\Domains\Lessons\Services;

use App\Enums\MediaType;
use App\Models\Lesson;
use App\Models\LessonProgress;

/**
 * Server-side watch-time evidence for video lessons.
 *
 * Progress percentages are client-reported, so a video lesson is never
 * considered complete until the learner has actually accumulated enough
 * watched seconds. Lessons without a video (text, image, document) keep the
 * old behaviour.
 */
final class LessonWatchEvidenceService
{
    /**
     * Fraction of the lesson duration a learner must watch.
     */
    private const float REQUIRED_WATCH_RATIO = 0.8;

    public function requiredSeconds(Lesson $lesson): ?int
    {
        $durationMinutes = (int) ($lesson->duration_minutes ?? 0);

        if ($durationMinutes <= 0) {
            return null;
        }

        $lesson->loadMissing('media');

        $hasVideo = $lesson->media->contains(
            fn ($media) => $media->type === MediaType::VIDEO
        );

        if (! $hasVideo) {
            return null;
        }

        $durationSeconds = $durationMinutes * 60;

        return max(15, (int) ceil($durationSeconds * self::REQUIRED_WATCH_RATIO));
    }

    public function satisfied(?LessonProgress $progress, Lesson $lesson): bool
    {
        $required = $this->requiredSeconds($lesson);

        if ($required === null) {
            return true;
        }

        return $progress !== null
            && (int) $progress->time_spent >= $required;
    }

    public function message(Lesson $lesson): string
    {
        $required = $this->requiredSeconds($lesson);

        if ($required === null) {
            return 'Watch the lesson before completing it.';
        }

        $minutes = (int) ceil($required / 60);

        return "Watch at least {$minutes} minutes of this video before completing the lesson.";
    }
}
