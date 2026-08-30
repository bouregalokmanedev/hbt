<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Courses\Actions\CreateCourseAction;
use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\Queries\CourseQuery;
use App\Domains\Courses\Queries\CurriculumQuery;
use App\Domains\Courses\Services\CourseAccessService;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Requests\CreateCourseRequest;
use App\Domains\Courses\Resources\CourseResource;
use App\Domains\Courses\Resources\CurriculumResource;
use App\Domains\Courses\Actions\PublishCourseAction;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use App\Enums\Courses\Difficulty;
use Illuminate\Http\JsonResponse;
use App\Domains\Courses\Actions\UpdateCourseAction;
use App\Domains\Courses\Actions\DeleteCourseAction;
use App\Domains\Courses\Actions\SubmitCourseForReviewAction;
use App\Domains\Courses\Actions\ArchiveCourseAction;
use App\Domains\Courses\Actions\RestoreCourseAction;
use App\Domains\Courses\Requests\UpdateCourseRequest;

class CourseController extends Controller
{
    public function __construct(
        private readonly CourseRepositoryInterface $courses,
    ) {
        $this->authorizeResource(
            Course::class,
            'course',
            [
                'except' => [
                    'index',
                    'show',
                ],
            ]
        );
    }

public function index(Request $request)
{
    $query = CourseQuery::make();

    /*
    |--------------------------------------------------------------------------
    | Public catalog
    |--------------------------------------------------------------------------
    |
    | Unauthenticated users can browse the course catalog, but they must
    | only see courses that are both:
    |
    | - published
    | - publicly visible
    |
    */
    if (!auth()->check()) {
        $query
            ->status('published')
            ->visibility('public');
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if ($request->filled('search')) {
        $query->search(
            $request->string('search')->toString()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    if ($request->filled('status')) {
        $query->status(
            $request->string('status')->toString()
        );
    }

    if ($request->filled('instructor')) {
        $query->byInstructor(
            (int) $request->input('instructor')
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

    if ($request->filled('visibility')) {
        $query->visibility(
            $request->string('visibility')->toString()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    $perPage = min(
        max((int) $request->input('per_page', 15), 1),
        100
    );

    return CourseResource::collection(
        $this->courses->paginate(
            $query,
            $perPage
        )
    );
}


    public function store(
    CreateCourseRequest $request,
    CreateCourseAction $action
): JsonResponse {
    $course = $action->execute(
        $request->toDto()
    );

    return (new CourseResource($course))
        ->response()
        ->setStatusCode(201);
}

    public function show(Course $course): CourseResource
    {
        return new CourseResource($course);
    }

    public function publish(
        Course $course,
        PublishCourseAction $action
    ): CourseResource {
        $this->authorize('publish', $course);

        $course = $action->execute(
            new PublishCourseData(
                courseId: $course->id,
                publisherId: auth()->id(),
            )
        );

        return new CourseResource($course);
    }

    public function curriculum(
        Course $course,
        CurriculumQuery $query,
        Request $request,
        CourseAccessService $access,
    ): CurriculumResource {
        abort_unless(
            $access->canBrowse($request->user(), $course),
            404,
        );

        // Curriculum is shared by Course Details and the lesson player.
        // Pass the student so each lesson includes that student's progress.
        // This endpoint remains public for guest preview browsing, so it is
        // not wrapped in auth:sanctum middleware. Resolve the Sanctum guard
        // explicitly to include progress for signed-in SPA learners.
        $user = auth('sanctum')->user() ?? $request->user();

        $course = $query->getForCourse(
            $course,
            $user,
        );

        return new CurriculumResource($course);
    }
    public function update(
    UpdateCourseRequest $request,
    Course $course,
    UpdateCourseAction $action
): CourseResource {
    $course = $action->execute(
        $request->toDto()
    );

    return new CourseResource($course);
}

public function destroy(
    Course $course,
    DeleteCourseAction $action
): JsonResponse {
    $action->execute($course);

    return response()->json([
        'message' => 'Course deleted successfully.',
    ]);
}

public function submitForReview(
    Course $course,
    SubmitCourseForReviewAction $action
): CourseResource {
    $this->authorize('submitForReview', $course);

    $course = $action->execute($course);

    return new CourseResource($course);
}

public function archive(
    Course $course,
    ArchiveCourseAction $action
): CourseResource {
    $this->authorize('archive', $course);

    $course = $action->execute($course);

    return new CourseResource($course);
}

public function restore(
    Course $course,
    RestoreCourseAction $action
): CourseResource {
    $this->authorize('restore', $course);

    $course = $action->execute($course);

    return new CourseResource($course);
}
}
