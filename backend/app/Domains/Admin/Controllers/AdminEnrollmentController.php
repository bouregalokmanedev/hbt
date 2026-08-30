<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminEnrollmentQuery;
use App\Domains\Admin\Resources\AdminEnrollmentResource;
use App\Http\Controllers\Controller;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use Illuminate\Http\Request;

final class AdminEnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Enrollment::class);

        return AdminEnrollmentResource::collection(
            app(AdminEnrollmentQuery::class)->paginate(
                $request->only([
                    'search', 'student', 'course', 'status', 'date_from', 'date_to',
                ]),
                $request->integer('per_page', 20),
            )
        );
    }

    public function show(Enrollment $enrollment): AdminEnrollmentResource
    {
        $this->authorize('view', $enrollment);

        $enrollment->load([
            'user:id,uuid,first_name,last_name,email',
            'course:id,title,slug,status',
        ]);

        $enrollment->setAttribute(
            'progress_percentage',
            CourseProgress::query()
                ->where('user_id', $enrollment->user_id)
                ->where('course_id', $enrollment->course_id)
                ->value('progress_percentage') ?? 0,
        );

        return new AdminEnrollmentResource($enrollment);
    }
}
