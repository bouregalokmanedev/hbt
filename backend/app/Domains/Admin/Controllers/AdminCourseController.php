<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminCourseQuery;
use App\Domains\Admin\Resources\AdminCourseResource;
use App\Domains\Admin\Services\CourseModerationService;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

final class AdminCourseController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Course::class);

        return AdminCourseResource::collection(
            app(AdminCourseQuery::class)->paginate(
                $request->only([
                    'search', 'status', 'instructor', 'category', 'difficulty',
                    'language', 'visibility', 'free',
                ]),
                $request->integer('per_page', 15),
            )
        );
    }

    public function show(Course $course): AdminCourseResource
    {
        $this->authorize('view', $course);

        return new AdminCourseResource($course->load([
            'instructor:id,uuid,first_name,last_name,email',
            'categories:id,name,slug',
        ])->loadCount('enrollments'));
    }

    public function approve(Course $course, CourseModerationService $moderation): AdminCourseResource
    {
        $this->authorize('publish', $course);

        return new AdminCourseResource($moderation->approve($course, (int) auth()->id()));
    }

    public function reject(Request $request, Course $course, CourseModerationService $moderation): AdminCourseResource
    {
        $this->authorize('update', $course);
        $data = $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        return new AdminCourseResource($moderation->reject($course, $data['reason']));
    }

    public function publish(Course $course, CourseModerationService $moderation): AdminCourseResource
    {
        $this->authorize('publish', $course);

        return new AdminCourseResource($moderation->publish($course, (int) auth()->id()));
    }

    public function archive(Course $course, CourseModerationService $moderation): AdminCourseResource
    {
        $this->authorize('archive', $course);

        return new AdminCourseResource($moderation->archive($course));
    }

    public function restore(Course $course, CourseModerationService $moderation): AdminCourseResource
    {
        $this->authorize('restore', $course);

        return new AdminCourseResource($moderation->restore($course));
    }
}
