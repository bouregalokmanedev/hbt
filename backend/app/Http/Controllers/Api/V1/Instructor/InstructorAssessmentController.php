<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\Competency;
use App\Domains\Instructor\Actions\Assessments\ArchiveAssessmentAction;
use App\Domains\Instructor\Actions\Assessments\CreateAssessmentAction;
use App\Domains\Instructor\Actions\Assessments\PublishAssessmentAction;
use App\Domains\Instructor\Actions\Assessments\RestoreAssessmentAction;
use App\Domains\Instructor\Actions\Assessments\SyncAssessmentCompetenciesAction;
use App\Domains\Instructor\Actions\Assessments\SyncAssessmentQuestionsAction;
use App\Domains\Instructor\Actions\Assessments\UnpublishAssessmentAction;
use App\Domains\Instructor\Actions\Assessments\UpdateAssessmentAction;
use App\Models\Course;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Instructor\InstructorAssessmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class InstructorAssessmentController extends Controller
{
    public function __construct(
        private readonly CreateAssessmentAction $createAction,
        private readonly UpdateAssessmentAction $updateAction,
        private readonly PublishAssessmentAction $publishAction,
        private readonly UnpublishAssessmentAction $unpublishAction,
        private readonly ArchiveAssessmentAction $archiveAction,
        private readonly RestoreAssessmentAction $restoreAction,
        private readonly SyncAssessmentCompetenciesAction $syncCompetenciesAction,
        private readonly SyncAssessmentQuestionsAction $syncQuestionsAction,
    ) {}

    /**
     * List instructor's assessments for a course.
     */
    public function index(Request $request, Course $course): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        $assessments = Assessment::with(['course:id,title'])
            ->where('course_id', $course->id)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->orderBy('created_at', 'desc')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json(InstructorAssessmentResource::collection($assessments));
    }

    /**
     * Flagged attempts for instructor review (blocked, blur-limit or
     * high-severity integrity signals).
     */
    public function flaggedAttempts(Request $request, Course $course): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        $flagged = app(\App\Domains\StudentAssessments\Services\IntegrityEnforcementService::class)
            ->flaggedForCourse($course->id, (int) $request->input('per_page', 50));

        return response()->json([
            'data' => $flagged->map(fn ($item) => [
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
            ])->values()->all(),
        ]);
    }

    /**
     * Create a new assessment.
     */
    public function store(Request $request, Course $course): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'minimum_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'required_quiz_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'required_scenarios' => ['nullable', 'integer', 'min:0'],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'is_required' => ['nullable', 'boolean'],
            'assessment_mode' => ['nullable', 'in:diagnostic,formative,practice,summative,final'],
            'interaction_types' => ['nullable', 'array'],
            'interaction_types.*' => ['string', 'in:knowledge,scenario,case_study,problem_solving,practical_task,reflection,adaptive'],
            'proficiency_thresholds' => ['nullable', 'array'],
            'adaptive_config' => ['nullable', 'array'],
            'section_id' => ['nullable', 'uuid', 'exists:sections,id'],
            'lesson_id' => ['nullable', 'uuid', 'exists:lessons,id'],
        ]);

        $assessment = $this->createAction->execute($course, $request->user(), $validated);

        return response()->json(['data' => new InstructorAssessmentResource($assessment)], 201);
    }

    /**
     * Show an assessment.
     */
    public function show(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $assessment->load(['course:id,title', 'section:id,title,course_id', 'lesson:id,title,section_id', 'competencies', 'questions.options']);

        return response()->json(['data' => new InstructorAssessmentResource($assessment)]);
    }

    /**
     * Update an assessment.
     */
    public function update(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'minimum_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'required_quiz_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'required_scenarios' => ['nullable', 'integer', 'min:0'],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'is_required' => ['nullable', 'boolean'],
            'assessment_mode' => ['nullable', 'in:diagnostic,formative,practice,summative,final'],
            'interaction_types' => ['nullable', 'array'],
            'interaction_types.*' => ['string', 'in:knowledge,scenario,case_study,problem_solving,practical_task,reflection,adaptive'],
            'proficiency_thresholds' => ['nullable', 'array'],
            'adaptive_config' => ['nullable', 'array'],
            'section_id' => ['nullable', 'uuid', 'exists:sections,id'],
            'lesson_id' => ['nullable', 'uuid', 'exists:lessons,id'],
        ]);

        $assessment = $this->updateAction->execute($assessment, $request->user(), $validated);

        return response()->json(['data' => new InstructorAssessmentResource($assessment)]);
    }

    /**
     * Delete (archive) an assessment.
     */
    public function destroy(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $this->archiveAction->execute($assessment, $request->user());

        return response()->json(['message' => 'Assessment archived']);
    }

    /**
     * Publish an assessment.
     */
    public function publish(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $assessment = $this->publishAction->execute($assessment, $request->user());

        return response()->json(['data' => new InstructorAssessmentResource($assessment)]);
    }

    /**
     * Unpublish an assessment.
     */
    public function unpublish(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $assessment = $this->unpublishAction->execute($assessment, $request->user());

        return response()->json(['data' => new InstructorAssessmentResource($assessment)]);
    }

    /**
     * Restore archived assessment.
     */
    public function restore(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $assessment = $this->restoreAction->execute($assessment, $request->user());

        return response()->json(['data' => new InstructorAssessmentResource($assessment)]);
    }

    /**
     * Answers awaiting human review (e.g. AI-unavailable long answers).
     */
    public function pendingReviews(Request $request, Course $course): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        $reviews = app(\App\Domains\StudentAssessments\Services\RegradeAssessmentService::class)
            ->pendingReviews($course->id, (int) $request->input('per_page', 50));

        return response()->json([
            'data' => $reviews->map(fn ($answer) => [
                'answer_id' => $answer->id,
                'attempt_id' => $answer->assessment_attempt_id,
                'attempt_number' => $answer->attempt?->attempt_number,
                'student_id' => $answer->attempt?->user_id,
                'question_id' => $answer->question_id,
                'question' => $answer->question?->question,
                'question_type' => $answer->question?->type?->value ?? $answer->question?->type,
                'answer' => $answer->answer,
                'points_earned' => $answer->points_earned,
                'updated_at' => $answer->updated_at,
            ])->values()->all(),
        ]);
    }

    /**
     * Apply human grades and recompute the attempt result.
     */
    public function regrade(Request $request, Course $course, AssessmentAttempt $attempt): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($attempt->assessment_id === null || $attempt->assessment->course_id !== $course->id) {
            abort(404);
        }

        $validated = $request->validate([
            'grades' => ['required', 'array', 'min:1'],
            'grades.*.points_earned' => ['required', 'integer', 'min:0'],
            'grades.*.feedback' => ['nullable', 'string'],
        ]);

        $result = app(\App\Domains\StudentAssessments\Services\RegradeAssessmentService::class)
            ->regrade($attempt, $request->user(), $validated['grades']);

        return response()->json([
            'data' => [
                'score' => $result['score'],
                'passed' => $result['passed'],
            ],
        ]);
    }

    /**
     * Sync competencies for an assessment.
     */
    public function syncCompetencies(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $validated = $request->validate([
            'competencies' => ['required', 'array'],
            'competencies.*.competency_id' => ['required', 'uuid'],
            'competencies.*.position' => ['nullable', 'integer', 'min:1'],
            'competencies.*.weight' => ['nullable', 'numeric', 'min:0.01', 'max:10'],
        ]);

        $assessment = $this->syncCompetenciesAction->execute($assessment, $request->user(), $validated['competencies']);

        return response()->json(['data' => new InstructorAssessmentResource($assessment->load('competencies'))]);
    }

    /**
     * Sync questions for an assessment (with competency mapping).
     */
    public function syncQuestions(Request $request, Course $course, Assessment $assessment): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        $validated = $request->validate([
            'questions' => ['required', 'array'],
            'questions.*.quiz_question_id' => ['required', 'uuid'],
            'questions.*.position' => ['nullable', 'integer', 'min:1'],
            'questions.*.points' => ['nullable', 'integer', 'min:1'],
            'questions.*.competency_id' => ['nullable', 'uuid'],
        ]);

        $assessment = $this->syncQuestionsAction->execute($assessment, $request->user(), $validated['questions']);

        return response()->json(['data' => new InstructorAssessmentResource($assessment->load(['questions.options']))]);
    }

    /**
     * Get available questions for this course (for selection).
     */
    public function availableQuestions(Request $request, Course $course): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        $quizIds = $course->sections->flatMap(fn ($s) => $s->quizzes->pluck('id'));

        $questions = \App\Domains\Quizzes\Models\QuizQuestion::with('options', 'quiz')
            ->whereHas('quiz', fn ($q) => $q->whereIn('id', $quizIds))
            ->when($request->input('search'), fn ($q, $s) => $q->where('question', 'like', "%{$s}%"))
            ->paginate((int) $request->input('per_page', 50));

        return response()->json($questions);
    }

    /**
     * Get available competencies for this course (for selection).
     */
    public function availableCompetencies(Request $request, Course $course): JsonResponse
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }

        $competencies = Competency::orderBy('name')->paginate((int) $request->input('per_page', 50));

        return response()->json($competencies);
    }
}