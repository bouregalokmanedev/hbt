<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Assessments\Models\Competency;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class SyncAssessmentQuestionsAction
{
    public function execute(Assessment $assessment, User $instructor, array $questions): Assessment
    {
        if ($assessment->course->instructor_id !== $instructor->id) {
            throw new LogicException('You can only manage questions for your own course assessments.');
        }

        return DB::transaction(function () use ($assessment, $questions) {
            // Delete existing questions
            $assessment->questions()->detach();

            // Create new mappings with competency_id
            foreach ($questions as $index => $questionData) {
                $question = QuizQuestion::find($questionData['quiz_question_id']);
                if (! $question) {
                    throw new LogicException("Question {$questionData['quiz_question_id']} not found.");
                }

                // Verify question belongs to instructor's course (via section/quiz)
                $courseQuizzes = $assessment->course->sections->flatMap(fn ($s) => $s->quizzes)->pluck('id');
                if (! $courseQuizzes->contains($question->quiz_id)) {
                    throw new LogicException("Question does not belong to this course.");
                }

                $competencyId = $questionData['competency_id'] ?? null;
                if ($competencyId) {
                    $competency = Competency::find($competencyId);
                    if (! $competency) {
                        throw new LogicException("Competency {$competencyId} not found.");
                    }
                }

                $assessment->questions()->attach($question->id, [
                    'position' => $questionData['position'] ?? $index + 1,
                    'points' => $questionData['points'] ?? 1,
                    'competency_id' => $competencyId,
                ]);
            }

            return $assessment->fresh()->load(['questions.options']);
        });
    }
}