<?php

namespace App\Http\Controllers;

use App\Domains\Lessons\Actions\CreateLessonAction;
use App\Domains\Lessons\Actions\DeleteLessonAction;
use App\Domains\Lessons\Actions\PublishLessonAction;
use App\Domains\Lessons\Actions\ReorderLessonAction;
use App\Domains\Lessons\Actions\UnpublishLessonAction;
use App\Domains\Lessons\Actions\UpdateLessonAction;
use App\Domains\Lessons\Requests\CreateLessonRequest;
use App\Domains\Lessons\Requests\ReorderLessonRequest;
use App\Domains\Lessons\Requests\UpdateLessonRequest;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

final class LessonController extends Controller
{
    public function __construct(
        private readonly CreateLessonAction $createLesson,
        private readonly UpdateLessonAction $updateLesson,
        private readonly DeleteLessonAction $deleteLesson,
        private readonly PublishLessonAction $publishLesson,
        private readonly UnpublishLessonAction $unpublishLesson,
        private readonly ReorderLessonAction $reorderLesson,
    ) {}

    public function store(
        CreateLessonRequest $request
    ): JsonResponse {
        $lesson = $this->createLesson->execute(
            $request->validated()
        );

        return response()->json(
            $lesson,
            201
        );
    }

    public function update(
        UpdateLessonRequest $request,
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'update',
            $lesson
        );

        $lesson = $this->updateLesson->execute(
            $lesson,
            $request->validated()
        );

        return response()->json(
            $lesson
        );
    }

    public function destroy(
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'delete',
            $lesson
        );

        $this->deleteLesson->execute(
            $lesson
        );

        return response()->json(
            status: 204
        );
    }

    public function publish(
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'publish',
            $lesson
        );

        $lesson = $this->publishLesson->execute(
            $lesson
        );

        return response()->json(
            $lesson
        );
    }

    public function unpublish(
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'unpublish',
            $lesson
        );

        $lesson = $this->unpublishLesson->execute(
            $lesson
        );

        return response()->json(
            $lesson
        );
    }

    public function reorder(
        ReorderLessonRequest $request,
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'reorder',
            $lesson
        );

        $lesson = $this->reorderLesson->execute(
            $lesson,
            $request->validated('position')
        );

        return response()->json(
            $lesson
        );
    }
}