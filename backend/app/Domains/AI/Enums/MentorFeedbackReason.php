<?php

namespace App\Domains\AI\Enums;

enum MentorFeedbackReason: string
{
    /*
    |--------------------------------------------------------------------------
    | Positive Feedback
    |--------------------------------------------------------------------------
    */

    case HELPFUL = 'helpful';

    case CLEAR = 'clear';

    case ACCURATE = 'accurate';

    case TECHNICALLY_CORRECT = 'technically_correct';

    case WELL_EXPLAINED = 'well_explained';

    case GOOD_EXAMPLE = 'good_example';

    case GOOD_DIAGNOSTIC_GUIDANCE = 'good_diagnostic_guidance';

    case PRACTICAL = 'practical';

    case RELEVANT = 'relevant';

    /*
    |--------------------------------------------------------------------------
    | Negative Feedback — Accuracy
    |--------------------------------------------------------------------------
    */

    case INCORRECT = 'incorrect';

    case FACTUALLY_WRONG = 'factually_wrong';

    case TECHNICALLY_INCORRECT = 'technically_incorrect';

    /*
    |--------------------------------------------------------------------------
    | Negative Feedback — Clarity
    |--------------------------------------------------------------------------
    */

    case UNCLEAR = 'unclear';

    case TOO_COMPLEX = 'too_complex';

    case TOO_VAGUE = 'too_vague';

    case TOO_LONG = 'too_long';

    case TOO_SHORT = 'too_short';

    /*
    |--------------------------------------------------------------------------
    | Negative Feedback — Educational Quality
    |--------------------------------------------------------------------------
    */

    case MISSING_EXPLANATION = 'missing_explanation';

    case MISSING_EXAMPLE = 'missing_example';

    case MISSING_STEPS = 'missing_steps';

    case NOT_PRACTICAL = 'not_practical';

    case NOT_DETAILED_ENOUGH = 'not_detailed_enough';

    /*
    |--------------------------------------------------------------------------
    | Negative Feedback — Relevance
    |--------------------------------------------------------------------------
    */

    case IRRELEVANT = 'irrelevant';

    case OFF_TOPIC = 'off_topic';

    case DID_NOT_ANSWER = 'did_not_answer';

    /*
    |--------------------------------------------------------------------------
    | Negative Feedback — Diagnostic
    |--------------------------------------------------------------------------
    */

    case UNSAFE_DIAGNOSTIC_ADVICE = 'unsafe_diagnostic_advice';

    case MISSING_DIAGNOSTIC_STEPS = 'missing_diagnostic_steps';

    case WRONG_DIAGNOSTIC_DIRECTION = 'wrong_diagnostic_direction';

    case MISSING_MEASUREMENT_GUIDANCE = 'missing_measurement_guidance';

    /*
    |--------------------------------------------------------------------------
    | Other
    |--------------------------------------------------------------------------
    */

    case OTHER = 'other';
}