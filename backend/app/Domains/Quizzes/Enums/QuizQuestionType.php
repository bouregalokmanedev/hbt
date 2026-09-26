<?php

namespace App\Domains\Quizzes\Enums;

enum QuizQuestionType: string
{
    case SINGLE_CHOICE = 'single_choice';
    case MULTIPLE_CHOICE = 'multiple_choice';
    case TRUE_FALSE = 'true_false';
    case SHORT_ANSWER = 'short_answer';
    case NUMERIC = 'numeric';
    case ORDERING = 'ordering';
    case MATCHING = 'matching';
    case LONG_ANSWER = 'long_answer';
}