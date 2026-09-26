<?php

namespace App\Domains\Admin\Controllers;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseFeedback;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminInstructorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $query = User::query()
            ->whereHas('roles', fn ($builder) => $builder->where('name', UserRole::INSTRUCTOR->value));

        if ($search !== '') {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function ($builder) use ($needle) {
                $builder->whereRaw('LOWER(first_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            });
        }

        if (in_array($status, ['active', 'suspended'], true)) {
            $query->where('status', $status);
        }

        $instructors = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $instructors->getCollection()->map(function (User $instructor) {
            $courseIds = Course::query()->where('instructor_id', $instructor->id)->pluck('id');

            return [
                'id' => $instructor->uuid,
                'name' => $instructor->full_name,
                'email' => $instructor->email,
                'status' => $instructor->status,
                'verified' => $instructor->hasVerifiedEmail(),
                'courses_count' => $courseIds->count(),
                'students_taught' => $courseIds->isNotEmpty()
                    ? Enrollment::query()->whereIn('course_id', $courseIds)->distinct()->count('user_id')
                    : 0,
                'average_rating' => $courseIds->isNotEmpty()
                    ? round((float) CourseFeedback::query()->whereIn('course_id', $courseIds)->avg('rating'), 1)
                    : null,
                'joined_at' => $instructor->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $instructors->currentPage(),
                'last_page' => $instructors->lastPage(),
                'per_page' => $instructors->perPage(),
                'total' => $instructors->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function show(User $instructor): JsonResponse
    {
        $this->authorize('view', $instructor);
        abort_unless($instructor->hasRole(UserRole::INSTRUCTOR->value), 404, 'Instructor not found.');

        $courses = Course::query()
            ->where('instructor_id', $instructor->id)
            ->withCount('enrollments')
            ->latest()
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status->value,
                'enrollments_count' => $course->enrollments_count,
                'updated_at' => $course->updated_at?->toISOString(),
            ]);

        $courseIds = $courses->pluck('id');

        $feedback = $courseIds->isNotEmpty()
            ? CourseFeedback::query()
                ->with(['user:id,first_name,last_name', 'course:id,title'])
                ->whereIn('course_id', $courseIds)
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (CourseFeedback $item) => [
                    'rating' => $item->rating,
                    'comment' => $item->comment,
                    'reviewer' => $item->user?->full_name,
                    'course' => $item->course?->title,
                    'created_at' => $item->created_at?->toISOString(),
                ])
            : [];

        return response()->json([
            'success' => true,
            'message' => 'Instructor retrieved.',
            'data' => [
                'id' => $instructor->uuid,
                'name' => $instructor->full_name,
                'email' => $instructor->email,
                'status' => $instructor->status,
                'verified' => $instructor->hasVerifiedEmail(),
                'joined_at' => $instructor->created_at?->toISOString(),
                'performance' => [
                    'courses_count' => $courses->count(),
                    'students_taught' => $courseIds->isNotEmpty()
                        ? Enrollment::query()->whereIn('course_id', $courseIds)->distinct()->count('user_id')
                        : 0,
                    'total_enrollments' => $courseIds->isNotEmpty()
                        ? Enrollment::query()->whereIn('course_id', $courseIds)->count()
                        : 0,
                    'average_rating' => $courseIds->isNotEmpty()
                        ? round((float) CourseFeedback::query()->whereIn('course_id', $courseIds)->avg('rating'), 1)
                        : null,
                    'reviews_count' => $courseIds->isNotEmpty()
                        ? CourseFeedback::query()->whereIn('course_id', $courseIds)->count()
                        : 0,
                ],
                'courses' => $courses,
                'recent_feedback' => $feedback,
            ],
        ]);
    }
}
