<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\StudentAssessments\Services\StudentAssessmentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AssessmentController extends Controller
{
    public function __construct(
        private readonly StudentAssessmentService $studentAssessments,
    ) {
    }

    /**
     * List every published assessment the learner can see, together with
     * eligibility and their own attempt history. The catalogue used to
     * re-derive these fields here; now it reads the same service as the
     * student dashboard so the two responses cannot drift.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = min(max((int) $request->integer('per_page', 50), 1), 100);
        $page = max((int) $request->integer('page', 1), 1);

        $all = $this->studentAssessments->listAvailable($user);
        $total = $all->count();

        $assessments = $all
            ->slice(($page - 1) * $perPage, $perPage)
            ->map(fn (array $item) => [
                'id' => $item['assessment']->id,
                'title' => $item['assessment']->title,
                'description' => $item['assessment']->description,
                'course_title' => $item['assessment']->course?->title,
                'minimum_score' => $item['assessment']->minimum_score,
                'max_attempts' => $item['assessment']->max_attempts,
                'time_limit_minutes' => $item['assessment']->time_limit_minutes,
                'questions_count' => $item['assessment']->questions_count,
                'eligibility' => $item['eligibility'],
                'attempt_history' => $item['attempt_history'],
            ])
            ->values();

        return response()->json([
            'data' => $assessments,
            'meta' => [
                'current_page' => $page,
                'last_page' => max((int) ceil($total / $perPage), 1),
                'per_page' => $perPage,
                'total' => $total,
            ],
        ]);
    }
}
