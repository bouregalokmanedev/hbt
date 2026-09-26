<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\StudentAssessments\Enums\AdaptiveAlgorithm;
use Illuminate\Support\Collection;

final class AdaptiveAssessmentService
{
    /**
     * IRT 3PL probability of correct response.
     * P(θ) = c + (1 - c) / (1 + exp(-a(θ - b)))
     */
    public function irtProbability(float $theta, float $a, float $b, float $c = 0): float
    {
        $exponent = -$a * ($theta - $b);
        // Prevent overflow
        $exponent = max(min($exponent, 20), -20);
        return $c + (1 - $c) / (1 + exp($exponent));
    }

    /**
     * Fisher Information for a question at ability θ.
     * I(θ) = a² * (P - c)² / (1 - c)² * (1 - P) / P
     */
    public function fisherInformation(float $theta, float $a, float $b, float $c = 0): float
    {
        $p = $this->irtProbability($theta, $a, $b, $c);
        if ($p <= 0 || $p >= 1) return 0;
        
        $q = 1 - $p;
        $pAdj = $p - $c;
        
        if ($pAdj <= 0) return 0;
        
        return ($a * $a) * (($pAdj / (1 - $c)) ** 2) * ($q / $p);
    }

    /**
     * Estimate ability (θ) using Maximum Likelihood Estimation.
     */
    public function estimateAbility(array $responses, array $questions): float
    {
        // responses: [question_id => (answer, is_correct)]
        // questions: [question_id => [irt_a, irt_b, irt_c]]
        
        $theta = 0.0; // Start at average ability
        $maxIterations = 20;
        $tolerance = 0.01;
        
        for ($iter = 0; $iter < $maxIterations; $iter++) {
            $numerator = 0;
            $denominator = 0;
            
            foreach ($responses as $qid => $response) {
                $q = $questions[$qid] ?? null;
                if (! $q || ! isset($q['irt_a'], $q['irt_b'])) continue;
                
                $a = $q['irt_a'];
                $b = $q['irt_b'];
                $c = $q['irt_c'] ?? 0;
                $isCorrect = $response['is_correct'] ?? false;
                
                $p = $this->irtProbability($theta, $a, $b, $c);
                $qProb = 1 - $p;
                
                if ($p <= 0 || $p >= 1) continue;
                
                $pAdj = $p - $c;
                if ($pAdj <= 0) continue;
                
                // Score function
                $score = ($isCorrect - $p) * $a * $pAdj / ($p * $qProb);
                // Information
                $info = ($a * $a) * (($pAdj / (1 - $c)) ** 2) * ($qProb / $p);
                
                $numerator += $score;
                $denominator += $info;
            }
            
            if ($denominator == 0) break;
            
            $delta = $numerator / $denominator;
            $theta += $delta;
            
            if (abs($delta) < $tolerance) break;
        }
        
        return max(min($theta, 4), -4); // Cap at reasonable range
    }

    /**
     * Select next question for CAT based on maximum information at current θ.
     */
    public function selectNextQuestion(float $theta, Collection $availableQuestions, array $answeredQuestionIds): ?QuizQuestion
    {
        $unanswered = $availableQuestions->whereNotIn('id', $answeredQuestionIds);
        
        if ($unanswered->isEmpty()) return null;
        
        $bestQuestion = null;
        $maxInfo = 0;
        
        foreach ($unanswered as $question) {
            $a = $question->irt_a ?? 1.0;
            $b = $question->irt_b ?? 0.0;
            $c = $question->irt_c ?? 0.2;
            
            $info = $this->fisherInformation($theta, $a, $b, $c);
            
            if ($info > $maxInfo) {
                $maxInfo = $info;
                $bestQuestion = $question;
            }
        }
        
        return $bestQuestion;
    }

    /**
     * Check if CAT should stop (precision achieved or max questions reached).
     */
    public function shouldStopCat(float $theta, array $responses, array $questions, int $minQuestions = 5, int $maxQuestions = 20, float $targetSE = 0.3): bool
    {
        if (count($responses) >= $maxQuestions) return true;
        if (count($responses) < $minQuestions) return false;
        
        // Calculate standard error
        $totalInfo = 0;
        foreach ($responses as $qid => $response) {
            $q = $questions[$qid] ?? null;
            if (! $q) continue;
            $totalInfo += $this->fisherInformation($theta, $q['irt_a'], $q['irt_b'], $q['irt_c'] ?? 0);
        }
        
        if ($totalInfo <= 0) return false;
        
        $se = 1 / sqrt($totalInfo);
        
        return $se <= $targetSE;
    }

    /**
     * Convert θ to percentage score (0-100).
     */
    public function thetaToPercentage(float $theta): float
    {
        // θ typically ranges from -3 to +3
        // Map to 0-100: θ = -3 => 0%, θ = +3 => 100%
        $percentage = (($theta + 3) / 6) * 100;
        return max(0, min(100, $percentage));
    }

    /**
     * Convert percentage to θ.
     */
    public function percentageToTheta(float $percentage): float
    {
        return (($percentage / 100) * 6) - 3;
    }
}