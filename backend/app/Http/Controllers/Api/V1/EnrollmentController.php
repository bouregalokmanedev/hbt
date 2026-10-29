<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CompleteEnrollmentAction;
use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Domains\Enrollments\Requests\CreateEnrollmentRequest;
use App\Domains\Enrollments\Resources\EnrollmentResource;
use App\Domains\Courses\Services\CoursePassService;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class EnrollmentController extends Controller
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $enrollments,
        private readonly CoursePassService $coursePass,
    ) {
    }

    public function index()
    {
        $user = auth()->user();

        $perPage = min(max((int) request('per_page', 100), 1), 100);

        $enrollments = $this->enrollments
            ->paginateByUser((int) $user->id, $perPage);

        $page = $enrollments->getCollection();

        $page->load('course.sections.lessons');

        $courseIds = $page->pluck('course_id')->unique()->values();

        $progressByCourse = CourseProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('course_id', $courseIds)
            ->get()
            ->keyBy('course_id');

        $completedByCourse = $this->completedLessonsByCourse((int) $user->id, $courseIds);

        $journeys = $this->coursePass->evaluateMany(
            $page->pluck('course')->filter()->unique('id')->values(),
            $user,
        );

        $page->each(
            function (Enrollment $enrollment) use ($progressByCourse, $completedByCourse, $journeys): void {
                $enrollment->setRelation(
                    'progress',
                    $progressByCourse->get($enrollment->course_id)
                );

                $totalLessons = $enrollment->course?->sections
                    ->where('status', SectionStatus::PUBLISHED)
                    ->sum(fn ($section) => $section->lessons
                        ->where('status', LessonStatus::PUBLISHED)
                        ->count()) ?? 0;

                $enrollment->setAttribute('total_lessons', $totalLessons);
                $enrollment->setAttribute(
                    'completed_lessons',
                    (int) ($completedByCourse->get($enrollment->course_id) ?? 0),
                );

                $enrollment->setAttribute(
                    'journey',
                    $journeys[$enrollment->course_id] ?? null,
                );
            }
        );

        return EnrollmentResource::collection($enrollments);
    }

    /**
     * Completed published lessons for every supplied course in one query.
     *
     * @param  Collection<int, string>  $courseIds
     * @return Collection<string, int>
     */
    private function completedLessonsByCourse(int $userId, Collection $courseIds): Collection
    {
        if ($courseIds->isEmpty()) {
            return collect();
        }

        return DB::table('lesson_progress')
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('sections', 'sections.id', '=', 'lessons.section_id')
            ->where('lesson_progress.user_id', $userId)
            ->whereNotNull('lesson_progress.completed_at')
            ->whereIn('sections.course_id', $courseIds->all())
            ->where('lessons.status', LessonStatus::PUBLISHED->value)
            ->where('sections.status', SectionStatus::PUBLISHED->value)
            ->groupBy('sections.course_id')
            ->selectRaw('sections.course_id as course_id, count(*) as aggregate')
            ->pluck('aggregate', 'course_id')
            ->map(fn ($count) => (int) $count);
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
