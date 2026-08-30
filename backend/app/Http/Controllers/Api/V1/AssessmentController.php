<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class AssessmentController extends Controller
{
    public function __construct(private readonly AssessmentEligibilityService $eligibility) {}

    public function index(): JsonResponse
    {
        $user = auth()->user();
        $assessments = Assessment::query()
            ->with('course:id,title')
            ->where('status', 'published')
            ->whereHas('course.enrollments', fn ($query) => $query->where('user_id', $user->id))
            ->withCount('questions')
            ->orderBy('published_at')
            ->get()
            ->map(fn (Assessment $assessment) => [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'description' => $assessment->description,
                'course_title' => $assessment->course?->title,
                'minimum_score' => $assessment->minimum_score,
                'max_attempts' => $assessment->max_attempts,
                'questions_count' => $assessment->questions_count,
                'eligibility' => $this->eligibility->evaluate($assessment, $user),
            ]);

        return response()->json(['data' => $assessments]);
    }
}
