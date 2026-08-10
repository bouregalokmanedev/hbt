<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Courses\Queries\InstructorCourseQuery;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Resources\CourseResource;
use App\Enums\Courses\Difficulty;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

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
}