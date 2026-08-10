<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Events\LessonUpdated;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Domains\Lessons\Services\LessonService;
use App\Enums\LessonStatus;
use App\Models\Lesson;

final class UpdateLessonAction
{
    public function __construct(
        private LessonRepositoryInterface $repository,
        private LessonService $service,
    ) {
    }

    private function containsSubstantiveChanges(
        array $data
    ): bool {
        return array_key_exists('title', $data)
            || array_key_exists('slug', $data)
            || array_key_exists('description', $data)
            || array_key_exists('content', $data);
    }

    public function execute(
        Lesson $lesson,
        array $data
    ): Lesson {
        /*
         * Validate position when it is explicitly being updated.
         */
        if (array_key_exists('position', $data)) {
            $this->service->validatePosition(
                (int) $data['position']
            );
        }

        /*
         * Published lessons return to draft when
         * substantive content changes are made.
         */
        $shouldReturnToDraft =
            $lesson->status === LessonStatus::PUBLISHED
            && $this->containsSubstantiveChanges($data);

        if ($shouldReturnToDraft) {
            $data['status'] = LessonStatus::DRAFT;
        }

        $lesson = $this->repository->update(
            $lesson,
            $data
        );

        event(
            new LessonUpdated($lesson)
        );

        return $lesson;
    }
}