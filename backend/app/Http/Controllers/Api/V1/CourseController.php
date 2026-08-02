<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Courses\Actions\CreateCourseAction;
use App\Domains\Courses\Requests\CreateCourseRequest;
use App\Domains\Courses\Resources\CourseResource;

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
)
{
    $this->authorize('publish', $course);

    $dto = new PublishCourseData(

        courseId: $course->id,

        publisherId: auth()->id(),

    );

    $course = $action->execute($dto);

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
}