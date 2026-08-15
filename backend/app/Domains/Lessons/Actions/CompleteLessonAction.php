<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Services\LessonProgressService;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class CompleteLessonAction
{
    public function __construct(
        private LessonProgressService $service,
    ) {
    }

    public function execute(
        User $user,
        Lesson $lesson
    ): LessonProgress {
        return DB::transaction(
            fn () => $this->service->complete(
                $user,
                $lesson
            )
        );
    }
}