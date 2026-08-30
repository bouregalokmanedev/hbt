<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CompleteEnrollmentAction;
use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Domains\Enrollments\Requests\CreateEnrollmentRequest;
use App\Domains\Enrollments\Resources\EnrollmentResource;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;

final class EnrollmentController extends Controller
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $enrollments,
    ) {
    }

    public function index()
    {
        $enrollments = $this->enrollments
            ->findByUser(auth()->id());

        $enrollments->load('course.sections.lessons');

        $progressByCourse = CourseProgress::query()
            ->where('user_id', auth()->id())
            ->whereIn('course_id', $enrollments->pluck('course_id'))
            ->get()
            ->keyBy('course_id');

        $enrollments->each(
            function (Enrollment $enrollment) use ($progressByCourse): void {
                $enrollment->setRelation(
                    'progress',
                    $progressByCourse->get($enrollment->course_id)
                );

                $totalLessons = $enrollment->course?->sections
                    ->sum(fn ($section) => $section->lessons->count()) ?? 0;
                $completedLessons = \App\Models\LessonProgress::query()
                    ->where('user_id', auth()->id())
                    ->whereNotNull('completed_at')
                    ->whereHas(
                        'lesson.section',
                        fn ($query) => $query->where('course_id', $enrollment->course_id)
                    )
                    ->count();

                $enrollment->setAttribute('total_lessons', $totalLessons);
                $enrollment->setAttribute('completed_lessons', $completedLessons);
            }
        );

        return EnrollmentResource::collection(
            $enrollments
        );
    }

    public function store(
        CreateEnrollmentRequest $request,
        CreateEnrollmentAction $action
    ): JsonResponse {
        $course = Course::query()->findOrFail(
            $request->string('course_id')->toString()
        );

        $enrollment = $action->execute(
            auth()->id(),
            $course,
        );

        return (new EnrollmentResource($enrollment))
            ->response()
            ->setStatusCode(201);
    }

    public function show(
        Enrollment $enrollment
    ): EnrollmentResource {
        $this->authorize('view', $enrollment);

        return new EnrollmentResource($enrollment);
    }

    public function complete(
        Enrollment $enrollment,
        CompleteEnrollmentAction $action
    ): EnrollmentResource {
        $this->authorize('complete', $enrollment);

        return new EnrollmentResource(
            $action->execute($enrollment)
        );
    }

    public function cancel(
        Enrollment $enrollment,
        CancelEnrollmentAction $action
    ): EnrollmentResource {
        $this->authorize('cancel', $enrollment);

        return new EnrollmentResource(
            $action->execute($enrollment)
        );
    }
}
