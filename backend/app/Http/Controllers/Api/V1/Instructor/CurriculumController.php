<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Courses\Actions\CreateSectionAction;
use App\Domains\Courses\Actions\DeleteSectionAction;
use App\Domains\Courses\Actions\PublishSectionAction;
use App\Domains\Courses\Actions\ReorderSectionAction;
use App\Domains\Courses\Actions\UnpublishSectionAction;
use App\Domains\Courses\Actions\UpdateSectionAction;
use App\Domains\Courses\Queries\CurriculumQuery;
use App\Domains\Courses\Resources\CurriculumResource;
use App\Domains\Instructor\Queries\InstructorCurriculumQuery;
use App\Domains\Lessons\Actions\CreateLessonAction;
use App\Domains\Lessons\Actions\DeleteLessonAction;
use App\Domains\Lessons\Actions\PublishLessonAction;
use App\Domains\Lessons\Actions\ReorderLessonAction;
use App\Domains\Lessons\Actions\UnpublishLessonAction;
use App\Domains\Lessons\Actions\UpdateLessonAction;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CurriculumController
{
    public function show(Course $course): CurriculumResource
    {
        $this->authorizeCourse($course);

        return new CurriculumResource(
            InstructorCurriculumQuery::forCourse($course)
        );
    }

    public function storeSection(
        Request $request,
        Course $course,
        CreateSectionAction $action,
    ): JsonResponse {
        $this->authorizeCourse($course);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'position' => ['nullable', 'integer', 'min:1'],
        ]);

        $data['course_id'] = $course->id;
        $data['position'] ??= ((int) $course->sections()->max('position')) + 1;

        return response()->json($action->execute($data), 201);
    }

    public function updateSection(
        Request $request,
        Section $section,
        UpdateSectionAction $action,
    ): JsonResponse {
        $this->authorizeSection($section);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        return response()->json($action->execute($section, $data));
    }

    public function destroySection(
        Section $section,
        DeleteSectionAction $action,
    ): JsonResponse {
        $this->authorizeSection($section);
        $action->execute($section);

        return response()->json(status: 204);
    }

    public function publishSection(
        Section $section,
        PublishSectionAction $action,
    ): JsonResponse {
        $this->authorizeSection($section);

        return response()->json($action->execute($section));
    }

    public function unpublishSection(
        Section $section,
        UnpublishSectionAction $action,
    ): JsonResponse {
        $this->authorizeSection($section);

        return response()->json($action->execute($section));
    }

    public function reorderSection(
        Request $request,
        Section $section,
        ReorderSectionAction $action,
    ): JsonResponse {
        $this->authorizeSection($section);
        $data = $request->validate(['position' => ['required', 'integer', 'min:1']]);

        return response()->json($action->execute($section, $data['position']));
    }

    public function storeLesson(
        Request $request,
        Section $section,
        CreateLessonAction $action,
    ): JsonResponse {
        $this->authorizeSection($section);

        $data = $this->lessonData($request, false);
        $data['section_id'] = $section->id;
        $data['position'] ??= ((int) $section->lessons()->max('position')) + 1;

        return response()->json($action->execute($data), 201);
    }

    public function updateLesson(
        Request $request,
        Lesson $lesson,
        UpdateLessonAction $action,
    ): JsonResponse {
        $this->authorizeLesson($lesson);

        return response()->json(
            $action->execute($lesson, $this->lessonData($request, true))
        );
    }

    public function destroyLesson(
        Lesson $lesson,
        DeleteLessonAction $action,
    ): JsonResponse {
        $this->authorizeLesson($lesson);
        $action->execute($lesson);

        return response()->json(status: 204);
    }

    public function publishLesson(
        Lesson $lesson,
        PublishLessonAction $action,
    ): JsonResponse {
        $this->authorizeLesson($lesson);

        return response()->json($action->execute($lesson));
    }

    public function unpublishLesson(
        Lesson $lesson,
        UnpublishLessonAction $action,
    ): JsonResponse {
        $this->authorizeLesson($lesson);

        return response()->json($action->execute($lesson));
    }

    public function reorderLesson(
        Request $request,
        Lesson $lesson,
        ReorderLessonAction $action,
    ): JsonResponse {
        $this->authorizeLesson($lesson);
        $data = $request->validate(['position' => ['required', 'integer', 'min:1']]);

        return response()->json($action->execute($lesson, $data['position']));
    }

    private function lessonData(Request $request, bool $partial): array
    {
        $prefix = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$prefix, 'string', 'max:255'],
            'slug' => [$prefix, 'string', 'max:255'],
            'description' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string'],
            'content' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string'],
            'duration_minutes' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'min:0'],
            'is_preview' => [$partial ? 'sometimes' : 'nullable', 'boolean'],
            'position' => [$partial ? 'sometimes' : 'nullable', 'integer', 'min:1'],
        ]);
    }

    private function authorizeCourse(Course $course): void
    {
        abort_unless(request()->user()?->can('update', $course), 403);
    }

    private function authorizeSection(Section $section): void
    {
        $section->loadMissing('course');
        $this->authorizeCourse($section->course);
    }

    private function authorizeLesson(Lesson $lesson): void
    {
        $lesson->loadMissing('section.course');
        $this->authorizeCourse($lesson->section->course);
    }
}
