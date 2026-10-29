<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Courses\Services\CourseAccessService;
use App\Domains\Courses\Services\CoursePassService;
use App\Domains\Courses\Services\CourseProgressService;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The learner's single "where am I?" endpoint for a course.
 *
 * Course detail, My Courses and the post-result screens all read this so the
 * next action, completion state and certificate availability cannot drift.
 */
final class CourseJourneyController extends Controller
{
    public function show(
        Request $request,
        Course $course,
        CourseAccessService $access,
        CoursePassService $coursePass,
        CourseProgressService $courseProgress,
    ): JsonResponse {
        $user = $request->user();

        abort_unless($access->hasFullAccess($user, $course), 403);

        $enrollment = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->latest('created_at')
            ->first();

        $progress = CourseProgress::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        // Keep stored progress honest when the learner lands here before a
        // lesson/assessment event has synced it.
        if ($progress === null || $progress->completed_at === null) {
            $progress = $courseProgress->sync($user, $course);

            // Syncing can complete the enrollment through CourseCompleted.
            // Return the fresh state, not the pre-sync snapshot.
            $enrollment?->refresh();
        }

        return response()->json([
            'data' => [
                'course' => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'status' => $course->status->value,
                ],
                'enrollment' => $enrollment !== null ? [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status->value,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                    'completed_at' => $enrollment->completed_at?->toISOString(),
                ] : null,
                'progress' => [
                    'progress_percentage' => (int) ($progress?->progress_percentage ?? 0),
                    'time_spent' => (int) ($progress?->time_spent ?? 0),
                    'completed_at' => $progress?->completed_at?->toISOString(),
                ],
                'pass' => $coursePass->evaluate($course, $user),
            ],
        ]);
    }
}
