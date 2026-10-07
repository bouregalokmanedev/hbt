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
use App\Models\User;
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
            $difficulty = Difficulty::tryFrom(
                $request->string('difficulty')->toString()
            );

            abort_unless(
                $difficulty !== null,
                422,
                'Invalid difficulty filter.'
            );

            $query->difficulty($difficulty);
        }

        if ($request->boolean('free')) {
            $query->free();
        }

        if ($request->filled('instructor')) {
            $query->byInstructor(
                $request->string('instructor')->toString()
            );
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

    /**
     * Public instructor showcase for the landing page: instructors that
     * own at least one published public course, with course + learner counts.
     */
    public function instructors(Request $request)
    {
        $limit = min(max((int) $request->integer('per_page', 8), 1), 24);

        $instructorIds = Course::query()
            ->where('status', CourseStatus::PUBLISHED)
            ->where('visibility', Visibility::PUBLIC)
            ->distinct()
            ->pluck('instructor_id');

        $instructors = User::query()
            ->role('Instructor')
            ->whereIn('id', $instructorIds)
            ->withCount(['instructedCourses as courses_count' => fn ($query) => $query
                ->where('status', CourseStatus::PUBLISHED)
                ->where('visibility', Visibility::PUBLIC)])
            ->withCount(['instructedLearners as learners_count'])
            ->orderByDesc('courses_count')
            ->limit($limit)
            ->get(['id', 'uuid', 'first_name', 'last_name', 'avatar', 'bio', 'country']);

        return response()->json([
            'data' => $instructors->map(fn (User $user) => [
                'id' => $user->uuid,
                'name' => trim("{$user->first_name} {$user->last_name}"),
                'avatar' => $user->avatar,
                'bio' => $user->bio,
                'country' => $user->country,
                'courses_count' => (int) $user->courses_count,
                'learners_count' => (int) $user->learners_count,
            ])->values(),
        ]);
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

        $course->loadMissing('instructor:id,uuid,first_name,last_name,username,avatar,bio');

        return new CourseResource($course);
    }
}
