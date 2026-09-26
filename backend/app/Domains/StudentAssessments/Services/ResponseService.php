<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\DTOs\SaveResponseData;
use App\Domains\StudentAssessments\Enums\ConfidenceLevel;
use App\Domains\StudentAssessments\Enums\ResponseStatus;
use App\Domains\StudentAssessments\Events\StudentResponseSaved;
use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class ResponseService
{
    public function save(SaveResponseData $data, User $user): StudentAssessmentResponse
    {
        return DB::transaction(function () use ($data, $user) {
            $attempt = AssessmentAttempt::findOrFail($data->attemptId);

            if ($attempt->user_id !== $user->id) {
                abort(404);
            }

            if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
                throw new LogicException('Cannot save response for non in-progress attempt.');
            }

            if ($attempt->expires_at?->isPast()) {
                $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
                abort(422, 'Time expired.');
            }

            // Validate question belongs to assessment
            $assessment = $attempt->assessment()->with('questions')->first();
            $questionIds = $assessment->questions->pluck('id')->map(fn ($id) => (string) $id);
            if (! $questionIds->contains((string) $data->questionId)) {
                throw new LogicException('Question does not belong to this assessment.');
            }

            // Update attempt activity & progress
            $total = $assessment->questions->count();
            $answeredCount = StudentAssessmentResponse::where('attempt_id', $attempt->id)->count();
            // If this is new question, increment
            $exists = StudentAssessmentResponse::where('attempt_id', $attempt->id)->where('question_id', $data->questionId)->exists();
            if (! $exists) {
                $answeredCount += 1;
            }
            $progress = $total > 0 ? (int) round(($answeredCount / $total) * 100) : 0;

            // Use query builder for raw increments to avoid model casting issues
            DB::table('assessment_attempts')->where('id', $attempt->id)->update([
                'last_activity_at' => now(),
                'progress_percentage' => $progress,
                'current_question_id' => $data->questionId,
                'time_spent_seconds' => DB::raw('COALESCE(time_spent_seconds,0) + '.(int) ($data->timeSpentSeconds ?? 0)),
                'updated_at' => now(),
            ]);

            $confidence = $data->confidenceLevel ? ConfidenceLevel::tryFrom($data->confidenceLevel) : null;

            $existingResponse = StudentAssessmentResponse::where('attempt_id', $attempt->id)->where('question_id', $data->questionId)->first();

            $response = StudentAssessmentResponse::updateOrCreate(
                [
                    'attempt_id' => $attempt->id,
                    'question_id' => $data->questionId,
                ],
                [
                    'answer' => $data->toAnswerPayload(),
                    'answer_metadata' => $data->answerMetadata,
                    'confidence_level' => $confidence,
                    'is_flagged' => $data->isFlagged ?? false,
                    'status' => ResponseStatus::ANSWERED,
                    'response_type' => $data->responseType ?? 'multiple_choice',
                    'time_spent_seconds' => $data->timeSpentSeconds ?? 0,
                    'answered_at' => now(),
                    'started_at' => $existingResponse?->started_at ?? now(),
                ]
            );

            StudentResponseSaved::dispatch($response);

            return $response;
        });
    }

    public function flag(string $attemptId, string $questionId, User $user, bool $flagged = true): StudentAssessmentResponse
    {
        $attempt = AssessmentAttempt::findOrFail($attemptId);
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        $response = StudentAssessmentResponse::firstOrCreate(
            ['attempt_id' => $attempt->id, 'question_id' => $questionId],
            ['answer' => [], 'status' => ResponseStatus::FLAGGED, 'is_flagged' => $flagged]
        );

        if ($response->exists) {
            $response->update(['is_flagged' => $flagged, 'status' => $flagged ? ResponseStatus::FLAGGED : ResponseStatus::ANSWERED]);
        }

        return $response->fresh();
    }

    public function getNavigation(AssessmentAttempt $attempt): array
    {
        $assessment = $attempt->assessment()->with('questions')->first();
        $questionIds = $assessment->questions->pluck('id')->map(fn ($id) => (string) $id);

        $responses = StudentAssessmentResponse::where('attempt_id', $attempt->id)->get()->keyBy(fn ($r) => (string) $r->question_id);

        return [
            'current_question_id' => $attempt->current_question_id,
            'current_section_id' => $attempt->current_section_id,
            'progress_percentage' => $attempt->progress_percentage ?? 0,
            'questions' => $questionIds->map(fn ($qid) => [
                'question_id' => $qid,
                'answered' => $responses->has($qid) && $responses->get($qid)->answer !== null,
                'flagged' => $responses->has($qid) ? (bool) $responses->get($qid)->is_flagged : false,
                'status' => $responses->has($qid) ? $responses->get($qid)->status?->value : 'not_started',
                'is_current' => (string) $attempt->current_question_id === $qid,
            ])->values()->all(),
            'answered_count' => $responses->whereNotNull('answer')->count(),
            'flagged_count' => $responses->where('is_flagged', true)->count(),
            'visited_count' => $responses->count(),
            'total' => $questionIds->count(),
        ];
    }
}
