<?php

namespace App\Http\Controllers;

use App\Domains\Lessons\Services\LessonProgressService;
use App\Domains\Lessons\Resources\LessonProgressResource;
use Illuminate\Http\Request;
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
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use App\Domains\Lessons\Resources\LessonResource;
use App\Domains\Lessons\Services\LessonAccessService;
use App\Domains\Lessons\Actions\CompleteLessonAction;


final class LessonController extends Controller
{
   public function __construct(
    private readonly CreateLessonAction $createLesson,
    private readonly UpdateLessonAction $updateLesson,
    private readonly DeleteLessonAction $deleteLesson,
    private readonly PublishLessonAction $publishLesson,
    private readonly UnpublishLessonAction $unpublishLesson,
    private readonly ReorderLessonAction $reorderLesson,
    private readonly LessonAccessService $lessonAccess,
    private readonly CompleteLessonAction $completeLesson,
    private readonly LessonProgressService $lessonProgressService,
) {}



public function store(
    CreateLessonRequest $request
): JsonResponse {
    $data = $request->validated();

    $section = Section::query()->findOrFail(
        $data['section_id']
    );

    Gate::authorize(
    'createLesson',
    $section
);

    $lesson = $this->createLesson->execute(
        $data
    );

    return response()->json(
        $lesson,
        201
    );
}

public function show(
    Lesson $lesson
): JsonResponse {
    abort_unless(
        $this->lessonAccess->canAccess(
            auth()->user(),
            $lesson
        ),
        403
    );

    return response()->json(
        new LessonResource($lesson)
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

        return response()->json($lesson);
    }

    public function destroy(
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'delete',
            $lesson
        );

        $this->deleteLesson->execute($lesson);

        return response()->json(status: 204);
    }

    public function publish(
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'publish',
            $lesson
        );

        $lesson = $this->publishLesson->execute($lesson);

        return response()->json($lesson);
    }

    public function unpublish(
        Lesson $lesson
    ): JsonResponse {
        Gate::authorize(
            'unpublish',
            $lesson
        );

        $lesson = $this->unpublishLesson->execute($lesson);

        return response()->json($lesson);
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

        return response()->json($lesson);
    }

    public function progress(
    Lesson $lesson
): JsonResponse {
    $progress = $this->lessonProgressService->getProgress(
        request()->user(),
        $lesson
    );

    return response()->json(
        new LessonProgressResource($progress)
    );
}

   public function complete(
    Lesson $lesson
): JsonResponse {
    $progress = $this->completeLesson->execute(
        request()->user(),
        $lesson
    );

    return response()->json(
        new LessonProgressResource($progress),
        201
    );
}
public function updateProgress(
    Request $request,
    Lesson $lesson
): JsonResponse {
    $progress = $this->lessonProgressService->updateProgress(
        $request->user(),
        $lesson,
        $request->validate([
            'progress_percentage' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'time_spent' => ['sometimes', 'integer', 'min:0'],
        ])
    );

    return (new LessonProgressResource($progress))
        ->response()
        ->setStatusCode(200);
}
}