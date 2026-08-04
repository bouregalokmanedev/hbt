<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Courses\Actions\CreateCourseAction;
use App\Domains\Courses\Requests\CreateCourseRequest;
use App\Domains\Courses\Resources\CourseResource;
use App\Domains\Courses\Queries\CurriculumQuery;
use App\Domains\Courses\Resources\CurriculumResource;
use App\Models\Course;
use App\Domains\Courses\Actions\PublishCourseAction;
use App\Domains\Courses\DTOs\PublishCourseData;

class CourseController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(
            \App\Models\Course::class,
            'course'
        );
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


    public function store(
        CreateCourseRequest $request,
        CreateCourseAction $action
    ): CourseResource {

        $course = $action->execute(
            $request->toDto()
        );

        return (new CourseResource($course))
    ->response()
    ->setStatusCode(201);
    }
    public function curriculum(
    Course $course,
    CurriculumQuery $query
): CurriculumResource {
    $this->authorize('view', $course);

    $course = $query->getForCourse($course);

    return new CurriculumResource($course);
}
}