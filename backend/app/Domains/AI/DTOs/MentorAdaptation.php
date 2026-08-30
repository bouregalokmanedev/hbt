<?php

namespace App\Domains\AI\DTOs;

final readonly class MentorAdaptation
{
    public function __construct(
        public string $learningLevel,
        public string $explanationDepth,
        public string $teachingStrategy,
        public string $difficulty,
        public bool $useSocraticQuestioning,
        public bool $useDiagnosticScaffolding,
        public bool $prioritizeRemediation,
        public bool $encourageMastery,
        public array $focusAreas,
    ) {
    }

    public function toArray(): array
    {
        return [
            'learning_level' => $this->learningLevel,
            'explanation_depth' => $this->explanationDepth,
            'teaching_strategy' => $this->teachingStrategy,
            'difficulty' => $this->difficulty,
            'use_socratic_questioning' => $this->useSocraticQuestioning,
            'use_diagnostic_scaffolding' => $this->useDiagnosticScaffolding,
            'prioritize_remediation' => $this->prioritizeRemediation,
            'encourage_mastery' => $this->encourageMastery,
            'focus_areas' => $this->focusAreas,
        ];
    }
}