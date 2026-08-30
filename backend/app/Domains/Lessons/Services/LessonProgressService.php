<?php

namespace App\Domains\Lessons\Services;

use App\Domains\Lessons\Events\LessonCompleted;
use App\Domains\Lessons\Events\LessonProgressUpdated;
use App\Domains\Lessons\Exceptions\LessonCannotBeCompletedException;
use App\Domains\Lessons\Repositories\LessonProgressRepositoryInterface;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Domains\Progression\Services\StudentProgressionService;

final class LessonProgressService
{
    public function __construct(
        private LessonAccessService $accessService,
        private LessonProgressRepositoryInterface $repository,
    ) {
    }

    public function getProgress(
        User $user,
        Lesson $lesson
    ): LessonProgress {
        if (! $this->accessService->canAccess($user, $lesson)) {
            throw new LessonCannotBeCompletedException(
                'User cannot access progress for this lesson.'
            );
        }

        $progress = $this->repository
            ->findByUserAndLesson(
                $user->id,
                $lesson->id
            );

        if ($progress !== null) {
            return $progress;
        }

        return $this->repository->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'started_at' => now(),
            'progress_percentage' => 0,
            'time_spent' => 0,
        ]);
    }

    public function complete(
        User $user,
        Lesson $lesson
    ): LessonProgress {
        if (! $this->accessService->canAccess($user, $lesson)) {
            throw new LessonCannotBeCompletedException(
                'User cannot access this lesson.'
            );
        }

        $progress = $this->repository
            ->findByUserAndLesson(
                $user->id,
                $lesson->id
            );

        if ($progress === null) {
            $progress = $this->repository->create([
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'started_at' => now(),
                'progress_percentage' => 100,
                'completed_at' => now(),
            ]);

            /*
             * IMPORTANT:
             *
             * This event is what starts:
             *
             * LessonProgressUpdated
             *        ↓
             * SyncSectionProgress
             *        ↓
             * SectionProgressUpdated
             *        ↓
             * SyncCourseProgress
             */
            event(new LessonProgressUpdated($progress));

            event(new LessonCompleted($progress));
            app(StudentProgressionService::class)->award($user, 'lesson_completed', 8, 14, "lesson:{$lesson->id}", ['lesson' => $lesson->title, 'label' => 'Lesson completed']);

            return $progress;
        }

        if ($progress->completed_at === null) {
            $progress = $this->repository->update(
                $progress,
                [
                    'progress_percentage' => 100,
                    'completed_at' => now(),
                ]
            );

            /*
             * This was missing before.
             *
             * Without it, completing a lesson directly through
             * the complete endpoint does not synchronize the
             * section/course progress.
             */
            event(new LessonProgressUpdated($progress));

            event(new LessonCompleted($progress));
            app(StudentProgressionService::class)->award($user, 'lesson_completed', 8, 14, "lesson:{$lesson->id}", ['lesson' => $lesson->title, 'label' => 'Lesson completed']);
        }

        return $progress;
    }

    public function updateProgress(
        User $user,
        Lesson $lesson,
        array $data
    ): LessonProgress {
        if (! $this->accessService->canAccess($user, $lesson)) {
            throw new LessonCannotBeCompletedException(
                'User cannot update progress for this lesson.'
            );
        }

        $progress = $this->repository
            ->findByUserAndLesson(
                $user->id,
                $lesson->id
            );

        if ($progress === null) {
            $data = [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'started_at' => now(),
                ...$data,
            ];

            if (($data['progress_percentage'] ?? 0) >= 100) {
                $data['progress_percentage'] = 100;
                $data['completed_at'] = now();
            }

            $progress = $this->repository->create($data);

            event(new LessonProgressUpdated($progress));

            if ($progress->completed_at !== null) {
                event(new LessonCompleted($progress));
                app(StudentProgressionService::class)->award($user, 'lesson_completed', 8, 14, "lesson:{$lesson->id}", ['lesson' => $lesson->title, 'label' => 'Lesson completed']);
            }

            return $progress;
        }

        $wasCompleted = $progress->completed_at !== null;

        if ($progress->started_at === null) {
            $data['started_at'] = now();
        }

        if (
            ($data['progress_percentage'] ?? $progress->progress_percentage) >= 100
            && ! $wasCompleted
        ) {
            $data['progress_percentage'] = 100;
            $data['completed_at'] = now();
        }

        $result = $this->repository->update(
            $progress,
            $data
        );

        event(new LessonProgressUpdated($result));

        if (! $wasCompleted && $result->completed_at !== null) {
            event(new LessonCompleted($result));
            app(StudentProgressionService::class)->award($user, 'lesson_completed', 8, 14, "lesson:{$lesson->id}", ['lesson' => $lesson->title, 'label' => 'Lesson completed']);
        }

        return $result;
    }
}
