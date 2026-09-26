<?php

namespace App\Domains\Assessments\Enums;

enum AssessmentMode: string
{
    case DIAGNOSTIC = 'diagnostic';
    case FORMATIVE = 'formative';
    case PRACTICE = 'practice';
    case SUMMATIVE = 'summative';
    case FINAL = 'final';

    public function label(): string
    {
        return match ($this) {
            self::DIAGNOSTIC => 'Diagnostic',
            self::FORMATIVE => 'Formative',
            self::PRACTICE => 'Practice',
            self::SUMMATIVE => 'Summative',
            self::FINAL => 'Final',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::DIAGNOSTIC => 'What do you already know? Pre-assessment before learning.',
            self::FORMATIVE => 'Are you understanding this lesson? Check during learning.',
            self::PRACTICE => 'Can you practice this skill? Low-stakes rehearsal.',
            self::SUMMATIVE => 'Have you mastered this section/course? End-of-unit assessment.',
            self::FINAL => 'Have you achieved the required competency? High-stakes certification.',
        };
    }

    public function isHighStakes(): bool
    {
        return in_array($this, [self::SUMMATIVE, self::FINAL]);
    }

    public function allowsRetake(): bool
    {
        return in_array($this, [self::DIAGNOSTIC, self::FORMATIVE, self::PRACTICE]);
    }

    public function defaultMaxAttempts(): ?int
    {
        return match ($this) {
            self::DIAGNOSTIC => 1,
            self::FORMATIVE => null,
            self::PRACTICE => null,
            self::SUMMATIVE => 3,
            self::FINAL => 2,
        };
    }
}