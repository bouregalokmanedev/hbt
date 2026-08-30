<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Courses\Queries\CourseQuery;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Resources\CourseResource;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

final class CatalogController extends Controller
{
    public function __construct(
        private readonly CourseRepositoryInterface $courses,
    ) {
    }

    public function courses(Request $request)
    {
        $query = CourseQuery::make()
            ->catalog();

        if ($request->filled('search')) {
            $query->search(
                $request->string('search')->toString()
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

        if ($request->filled('language')) {
            $query->language(
                $request->string('language')->toString()
            );
        }

        if ($request->filled('category')) {
            $query->category(
                $request->string('category')->toString()
            );
        }

        $perPage = min(
            max(
                $request->integer('per_page', 15),
                1
            ),
            100
        );

        $paginator = $this->courses->paginate(
            $query,
            $perPage
        );

        /*
        |--------------------------------------------------------------------------
        | Current student's enrollment state
        |--------------------------------------------------------------------------
        |
        | Only load enrollment information when a student is authenticated.
        | Public visitors don't need this relationship.
        |
        */

        if ($request->user()) {
            $paginator
                ->getCollection()
                ->load([
                    'enrollments' => function ($query) use ($request) {
                        $query->where(
                            'user_id',
                            $request->user()->id
                        );
                    },
                ]);
        }

        return CourseResource::collection(
            $paginator
        );
    }

    public function show(
        Request $request,
        Course $course
    ): CourseResource {
        if (
            $course->status !== CourseStatus::PUBLISHED ||
            $course->visibility !== Visibility::PUBLIC
        ) {
            abort(404);
        }

        if ($request->user()) {
            $course->load([
                'enrollments' => function ($query) use ($request) {
                    $query->where(
                        'user_id',
                        $request->user()->id
                    );
                },
            ]);
        }

        return new CourseResource($course);
    }
}
