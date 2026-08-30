<?php

namespace App\Domains\Quizzes\Enums;

enum QuizAttemptStatus: string
{
    case IN_PROGRESS = 'in_progress';
    case SUBMITTED = 'submitted';
    case EXPIRED = 'expired';
}