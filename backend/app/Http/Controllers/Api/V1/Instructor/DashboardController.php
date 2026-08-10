<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Courses\Queries\InstructorCourseQuery;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Resources\InstructorDashboardResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly CourseRepositoryInterface $courses,
    ) {
    }

    public function show(Request $request): InstructorDashboardResource
    {
        $query = InstructorCourseQuery::make()
            ->forInstructor((int) auth()->id());

        $perPage = min(
            max(
                $request->integer('per_page', 15),
                1
            ),
            100
        );

        $courses = $this->courses->paginateInstructorCourses(
            $query,
            $perPage
        );

        $statistics = $this->courses->instructorStatistics(
            (int) auth()->id()
        );

        return new InstructorDashboardResource([
            'courses' => $courses,
            'statistics' => $statistics,
        ]);
    }
}