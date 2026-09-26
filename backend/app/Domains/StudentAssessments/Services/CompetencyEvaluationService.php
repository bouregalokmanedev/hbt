<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\Competency;
use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use App\Domains\StudentAssessments\Events\StudentCompetencyEvaluated;
use App\Domains\StudentAssessments\Models\StudentAssessmentEvidence;
use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Domains\StudentAssessments\Models\StudentCompetencyResult;
use Illuminate\Support\Collection;

final class CompetencyEvaluationService
{
    /**
     * Evaluate competencies — groups by question.competency_id from assessment_questions pivot.
     * Falls back to 'Overall' if no competency mapping exists.
     */
    public function evaluate(AssessmentAttempt $attempt, StudentAssessmentResult $studentResult, array $scoring): array
    {
        $assessment = $attempt->assessment()->first();

        // Pre-load AssessmentQuestion pivots with competency
        $questionPivots = \App\Domains\Assessments\Models\AssessmentQuestion::where('assessment_id', $assessment->id)
            ->with('competency')
            ->get()
            ->keyBy('quiz_question_id');

        // Build evidence rows per question, grouped by competency (via pivot)
        $evidenceByCompetency = [];
        foreach ($scoring['results'] ?? [] as $row) {
            // Get the AssessmentQuestion pivot from pre-loaded
            $aq = $questionPivots->get($row['question_id']);
            $competency = $aq?->competency;
            $competencyKey = $competency?->id ?? 'overall';
            $competencyName = $competency?->name ?? 'Overall';

            if (! isset($evidenceByCompetency[$competencyKey])) {
                $evidenceByCompetency[$competencyKey] = [
                    'competency' => $competency,
                    'competency_name' => $competencyName,
                    'evidence' => [],
                    'points_earned' => 0,
                    'total_points' => 0,
                ];
            }

            $evidenceRow = StudentAssessmentEvidence::create([
                'attempt_id' => $attempt->id,
                'result_id' => $studentResult->id,
                'question_id' => $row['question_id'],
                'competency_id' => $competency?->id,
                'evidence_type' => 'question_response',
                'response' => collect($scoring['evidence'])->firstWhere('question_id', $row['question_id']) ?? [],
                'points' => $row['points_earned'] ?? 0,
                'quality_score' => round(($row['fraction'] ?? (($row['is_correct'] ?? false) ? 1 : 0)) * 100, 2),
                'metadata' => $row,
            ]);

            $evidenceByCompetency[$competencyKey]['evidence'][] = $evidenceRow;
            $evidenceByCompetency[$competencyKey]['points_earned'] += $row['points_earned'] ?? 0;
            $evidenceByCompetency[$competencyKey]['total_points'] += $row['points'] ?? 0;
        }

        // Create competency results
        $results = [];
        foreach ($evidenceByCompetency as $key => $data) {
            $percentage = $data['total_points'] > 0
                ? round(($data['points_earned'] / $data['total_points']) * 100, 2)
                : 0;

            $proficiency = ProficiencyLevel::fromPercentage(
                $percentage,
                $attempt->assessment?->getProficiencyThresholds()
            );

            $strength = match (true) {
                $percentage >= 80 => 'strong',
                $percentage >= 60 => 'developing',
                default => 'weak',
            };

            $results[] = StudentCompetencyResult::create([
                'attempt_id' => $attempt->id,
                'result_id' => $studentResult->id,
                'competency_id' => $data['competency']?->id,
                'competency_name' => $data['competency_name'],
                'score' => $data['points_earned'],
                'percentage' => $percentage,
                'proficiency_level' => $proficiency,
                'evidence_count' => count($data['evidence']),
                'strength_level' => $strength,
            ]);
        }

        StudentCompetencyEvaluated::dispatch($studentResult);

        return $results;
    }
}
