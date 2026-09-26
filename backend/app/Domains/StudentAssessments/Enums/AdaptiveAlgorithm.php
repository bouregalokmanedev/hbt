<?php

namespace App\Domains\StudentAssessments\Enums;

enum AdaptiveAlgorithm: string
{
    case NONE = 'none';
    case IRT_1PL = 'irt_1pl';       // Rasch model
    case IRT_2PL = 'irt_2pl';       // 2-parameter logistic
    case IRT_3PL = 'irt_3pl';       // 3-parameter logistic
    case CAT = 'cat';               // Computerized Adaptive Testing

    public function requiresCalibration(): bool
    {
        return in_array($this, [self::IRT_1PL, self::IRT_2PL, self::IRT_3PL, self::CAT]);
    }
}