<?php

namespace App\Domains\StudentAssessments\Enums;

enum ConfidenceLevel: string
{
    case GUESSING = 'guessing';
    case SOMEWHAT_CONFIDENT = 'somewhat_confident';
    case CONFIDENT = 'confident';
    case VERY_CONFIDENT = 'very_confident';
}
