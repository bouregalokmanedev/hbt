<?php

namespace App\Domains\StudentAssessments\Enums;

enum ProficiencyLevel: string
{
    case NOVICE = 'novice';
    case BEGINNER = 'beginner';
    case DEVELOPING = 'developing';
    case INTERMEDIATE = 'intermediate';
    case PROFICIENT = 'proficient';
    case ADVANCED = 'advanced';
    case EXPERT = 'expert';

    /**
     * Resolve level from percentage using configurable thresholds.
     * Default mirrors spec: 0-39 Novice, 40-54 Beginner, 55-69 Developing, 70-79 Intermediate, 80-89 Proficient, 90-100 Advanced
     * EXPERT can be assigned manually or via 95+ if configured.
     */
    public static function fromPercentage(float $percentage, ?array $thresholds = null): self
    {
        $thresholds ??= config('assessments.proficiency_thresholds', [
            'novice' => 40,
            'beginner' => 55,
            'developing' => 70,
            'intermediate' => 80,
            'proficient' => 90,
            'advanced' => 100,
        ]);

        if ($percentage < ($thresholds['novice'] ?? 40)) {
            return self::NOVICE;
        }
        if ($percentage < ($thresholds['beginner'] ?? 55)) {
            return self::BEGINNER;
        }
        if ($percentage < ($thresholds['developing'] ?? 70)) {
            return self::DEVELOPING;
        }
        if ($percentage < ($thresholds['intermediate'] ?? 80)) {
            return self::INTERMEDIATE;
        }
        if ($percentage < ($thresholds['proficient'] ?? 90)) {
            return self::PROFICIENT;
        }
        if ($percentage < 95) {
            return self::ADVANCED;
        }

        return self::EXPERT;
    }

    public function label(): string
    {
        return match ($this) {
            self::NOVICE => 'Novice',
            self::BEGINNER => 'Beginner',
            self::DEVELOPING => 'Developing',
            self::INTERMEDIATE => 'Intermediate',
            self::PROFICIENT => 'Proficient',
            self::ADVANCED => 'Advanced',
            self::EXPERT => 'Expert',
        };
    }
}
