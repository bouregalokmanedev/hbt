<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorAdaptation;
use App\Domains\AI\DTOs\MentorStudentProfile;

final class MentorAdaptationService
{
    public function build(
        MentorStudentProfile $profile,
    ): MentorAdaptation {
        $learningLevel = $profile->learningLevel->value;

        return new MentorAdaptation(
            learningLevel: $learningLevel,

            explanationDepth: $this->explanationDepth(
                $learningLevel
            ),

            teachingStrategy: $this->teachingStrategy(
                $profile
            ),

            difficulty: $this->difficulty(
                $profile
            ),

            useSocraticQuestioning: $this->shouldUseSocraticQuestioning(
                $profile
            ),

            useDiagnosticScaffolding: $this->shouldUseDiagnosticScaffolding(
                $profile
            ),

            prioritizeRemediation: $this->shouldPrioritizeRemediation(
                $profile
            ),

            encourageMastery: $this->shouldEncourageMastery(
                $profile
            ),

            focusAreas: $this->focusAreas(
                $profile
            ),
        );
    }

    private function explanationDepth(
        string $learningLevel,
    ): string {
        return match ($learningLevel) {
            'beginner' => 'foundational',
            'developing' => 'moderate',
            'intermediate' => 'moderate',
            'advanced' => 'deep',
            default => 'moderate',
        };
    }


private function teachingStrategy(
    MentorStudentProfile $profile,
): string {
    if ($this->shouldPrioritizeRemediation($profile)) {
        return 'remedial';
    }

    if ($this->shouldUseSocraticQuestioning($profile)) {
        return 'socratic';
    }

    if ($this->shouldUseDiagnosticScaffolding($profile)) {
        return 'diagnostic';
    }

    return 'explanatory';
}

    private function difficulty(
        MentorStudentProfile $profile,
    ): string {
        if ($this->shouldPrioritizeRemediation($profile)) {
            return 'remedial';
        }

        if ($this->shouldEncourageMastery($profile)) {
            return 'challenging';
        }

        return 'current_level';
    }

    private function shouldUseSocraticQuestioning(
        MentorStudentProfile $profile,
    ): bool {
        return in_array(
            $profile->learningLevel->value,
            [
                'intermediate',
                'advanced',
            ],
            true
        )
        && ! $this->shouldPrioritizeRemediation($profile);
    }

    private function shouldUseDiagnosticScaffolding(
        MentorStudentProfile $profile,
    ): bool {
        return $profile->diagnosticPerformance > 0;
    }

    private function shouldPrioritizeRemediation(
        MentorStudentProfile $profile,
    ): bool {
        if ($profile->overallProgress < 40) {
            return true;
        }

        if (
            $profile->quizPerformance > 0
            && $profile->quizPerformance < 60
        ) {
            return true;
        }

        if (
            $profile->assessmentPerformance > 0
            && $profile->assessmentPerformance < 60
        ) {
            return true;
        }

        if (
            $profile->diagnosticPerformance > 0
            && $profile->diagnosticPerformance < 60
        ) {
            return true;
        }

        return false;
    }

    private function shouldEncourageMastery(
        MentorStudentProfile $profile,
    ): bool {
        return $profile->overallProgress >= 80
            && ! $this->shouldPrioritizeRemediation($profile);
    }

    private function focusAreas(
        MentorStudentProfile $profile,
    ): array {
        $areas = [];

        if ($this->shouldPrioritizeRemediation($profile)) {
            $areas[] = 'weak_concepts';
        }

        if ($profile->courseProgress > 0) {
            $areas[] = 'current_course';
        }

        if ($profile->lessonProgress > 0) {
            $areas[] = 'current_lesson';
        }

        if ($this->shouldUseDiagnosticScaffolding($profile)) {
            $areas[] = 'diagnostic_reasoning';
        }

        return array_values(
            array_unique($areas)
        );
    }
}