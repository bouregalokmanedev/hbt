<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\StudentAssessments\Services\IntegrityEnforcementService;
use App\Domains\StudentAssessments\Services\RegradeAssessmentService;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Everything waiting on this instructor, across all of their courses at once.
 *
 * The per-course queues (`pendingReviews`, `flaggedAttempts`) are unchanged and
 * still back the assessment workspace; this view aggregates them so the
 * dashboard can show a single ordered list of work instead of making the
 * instructor visit each course to discover it.
 */
final class AttentionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instructorId = (int) $request->user()->id;

        $courses = Course::query()
            ->where('instructor_id', $instructorId)
            ->get(['id', 'title']);

        $courseIds = $courses->pluck('id');

        $limit = min(100, max(1, (int) $request->input('limit', 50)));

        // One lookup lets both lists carry their course without the services
        // needing to eager-load a second relation hop.
        $courseByAssessment = Assessment::query()
            ->whereIn('course_id', $courseIds)
            ->pluck('course_id', 'id');

        $courseById = $courses->keyBy('id');
        $courseTitle = function (string $assessmentId) use ($courseByAssessment, $courseById): ?string {
            $courseId = $courseByAssessment->get($assessmentId);

            return $courseId === null
                ? null
                : $courseById->get($courseId)?->title;
        };

        $reviews = app(RegradeAssessmentService::class)
            ->pendingReviewsForCourses($courseIds, $limit);

        $flagged = app(IntegrityEnforcementService::class)
            ->flaggedForCourses($courseIds, $limit);

        $pendingReviews = $reviews->map(function ($answer) use ($courseByAssessment, $courseById) {
            $assessmentId = $answer->attempt?->assessment_id;
            $courseId = $assessmentId === null
                ? null
                : $courseByAssessment->get($assessmentId);

            return [
                'answer_id' => $answer->id,
                'attempt_id' => $answer->assessment_attempt_id,
                'attempt_number' => $answer->attempt?->attempt_number,
                'student_id' => $answer->attempt?->user_id,
                'question_id' => $answer->question_id,
                'question' => $answer->question?->question,
                'question_type' => $answer->question?->type?->value ?? $answer->question?->type,
                'answer' => $answer->answer,
                'points_earned' => $answer->points_earned,
                'course_id' => $courseId,
                'course_title' => $courseId === null ? null : $courseById->get($courseId)?->title,
                'updated_at' => $answer->updated_at,
            ];
        })->values()->all();

        $flaggedAttempts = $flagged->map(function (array $item) use ($courseByAssessment, $courseTitle) {
            $assessmentId = $item['attempt']->assessment_id ?? null;

            return [
                'attempt_id' => $item['attempt']->id,
                'assessment' => $item['attempt']->assessment
                    ? ['id' => $item['attempt']->assessment->id, 'title' => $item['attempt']->assessment->title]
                    : null,
                'student' => $item['attempt']->user
                    ? ['id' => $item['attempt']->user->id, 'name' => $item['attempt']->user->full_name]
                    : null,
                'status' => $item['attempt']->status->value,
                'blocked_at' => $item['attempt']->blocked_at,
                'risk_score' => $item['risk_score'],
                'risk_level' => $item['risk_level'],
                'issues' => $item['issues'],
                'course_id' => $assessmentId === null ? null : $courseByAssessment->get($assessmentId),
                'course_title' => $assessmentId === null ? null : $courseTitle($assessmentId),
            ];
        })->values()->all();

        return response()->json([
            'data' => [
                'counts' => [
                    'pending_reviews' => count($pendingReviews),
                    'flagged_attempts' => count($flaggedAttempts),
                    'total' => count($pendingReviews) + count($flaggedAttempts),
                ],
                'pending_reviews' => $pendingReviews,
                'flagged_attempts' => $flaggedAttempts,
            ],
        ]);
    }
}
