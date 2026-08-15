<?php

namespace App\Http\Controllers\Api;

use App\Domains\Courses\Resources\CourseProgressResource;
use App\Domains\Courses\Services\CourseProgressService;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

final class CourseProgressController extends Controller
{
    public function show(
        Request $request,
        Course $course,
        CourseProgressService $service
    ): CourseProgressResource {
        $progress = $service->find(
            $request->user(),
            $course
        );

        abort_unless($progress, 404);

        return new CourseProgressResource($progress);
    }

    public function sync(
        Request $request,
        Course $course,
        CourseProgressService $service
    ): CourseProgressResource {
        $progress = $service->sync(
            $request->user(),
            $course
        );

        return new CourseProgressResource($progress);
    }
}