<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Courses\Actions\ArchiveCourseAction;
use App\Domains\Courses\Actions\CreateCourseAction;
use App\Domains\Courses\Actions\DeleteCourseAction;
use App\Domains\Courses\Actions\PublishCourseAction;
use App\Domains\Courses\Actions\RestoreCourseAction;
use App\Domains\Courses\Actions\SubmitCourseForReviewAction;
use App\Domains\Courses\Actions\UnpublishCourseAction;
use App\Domains\Courses\Actions\UpdateCourseAction;
use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\Queries\InstructorCourseQuery;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Requests\CreateCourseRequest;
use App\Domains\Courses\Requests\UpdateCourseRequest;
use App\Domains\Instructor\Queries\InstructorCourseAnalyticsQuery;
use App\Domains\Instructor\Queries\InstructorCourseCertificateQuery;
use App\Domains\Instructor\Queries\InstructorCourseFeedbackQuery;
use App\Domains\Instructor\Resources\InstructorCourseAnalyticsResource;
use App\Domains\Instructor\Queries\InstructorCourseStudentsQuery;
use App\Domains\Instructor\Resources\InstructorCourseStudentResource;
use App\Domains\Courses\Resources\CourseResource;
use App\Enums\Courses\Difficulty;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

final class CourseController extends Controller
{
    public function __construct(
        private readonly CourseRepositoryInterface $courses,
    ) {
    }

    public function index(Request $request)
    {
        $query = InstructorCourseQuery::make()
            ->forInstructor((int) auth()->id());

        if ($request->filled('search')) {
            $query->search(
                $request->string('search')->toString()
            );
        }

        if ($request->filled('status')) {
            $query->status(
                $request->string('status')->toString()
            );
        }

        if ($request->filled('difficulty')) {
            $query->difficulty(
                Difficulty::from(
                    $request->string('difficulty')->toString()
                )
            );
        }

        if ($request->boolean('free')) {
            $query->free();
        }

        $perPage = min(
            max(
                $request->integer('per_page', 15),
                1
            ),
            100
        );

        return CourseResource::collection(
            $this->courses->paginateInstructorCourses(
                $query,
                $perPage
            )
        );
    }

    public function show(Course $course): CourseResource
    {
        $this->authorize('view', $course);

        return new CourseResource($course);
    }

    public function store(
        CreateCourseRequest $request,
        CreateCourseAction $action,
    ): JsonResponse {
        $course = $action->execute($request->toDto());

        return (new CourseResource($course))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateCourseRequest $request,
        Course $course,
        UpdateCourseAction $action,
    ): CourseResource {
        return new CourseResource(
            $action->execute($request->toDto())
        );
    }

    public function destroy(
        Course $course,
        DeleteCourseAction $action,
    ): JsonResponse {
        $this->authorize('delete', $course);

        $action->execute($course);

        return response()->json([
            'message' => 'Course deleted successfully.',
        ]);
    }

    public function publish(
        Course $course,
        PublishCourseAction $action,
    ): CourseResource {
        $this->authorize('publish', $course);

        return new CourseResource(
            $action->execute(new PublishCourseData(
                courseId: $course->id,
                publisherId: (int) auth()->id(),
            ))
        );
    }

    public function unpublish(
        Course $course,
        UnpublishCourseAction $action,
    ): CourseResource {
        $this->authorize('unpublish', $course);

        return new CourseResource($action->execute($course));
    }

    public function submitForReview(
        Course $course,
        SubmitCourseForReviewAction $action,
    ): CourseResource {
        $this->authorize('submitForReview', $course);

        return new CourseResource($action->execute($course));
    }

    public function archive(
        Course $course,
        ArchiveCourseAction $action,
    ): CourseResource {
        $this->authorize('archive', $course);

        return new CourseResource($action->execute($course));
    }

    public function restore(
        Course $course,
        RestoreCourseAction $action,
    ): CourseResource {
        $this->authorize('restore', $course);

        return new CourseResource($action->execute($course));
    }

    public function analytics(
    string $course
): InstructorCourseAnalyticsResource {
    return new InstructorCourseAnalyticsResource(
        InstructorCourseAnalyticsQuery::for(
            (int) auth()->id(),
            $course,
        )->overview()
    );
}

public function students(
    Request $request,
    string $course,
) {
    $perPage = min(
        max(
            $request->integer('per_page', 20),
            1
        ),
        100
    );

    return InstructorCourseStudentResource::collection(
        InstructorCourseStudentsQuery::for(
            (int) auth()->id(),
            $course,
        )->paginate($perPage)
    );
}

    public function feedback(string $course): JsonResponse
    {
        return response()->json([
            'data' => InstructorCourseFeedbackQuery::for(
                (int) auth()->id(),
                $course,
            ),
        ]);
    }

    public function certificates(string $course): JsonResponse
    {
        return response()->json([
            'data' => InstructorCourseCertificateQuery::for(
                (int) auth()->id(),
                $course,
            ),
        ]);
    }
}
