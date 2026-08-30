<?php

namespace App\Domains\AI\Enums;

enum MentorFeedbackRating: string
{
    case POSITIVE = 'positive';
    case NEGATIVE = 'negative';
}