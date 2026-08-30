<?php

namespace App\Domains\Quizzes\Enums;

enum QuizStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';
}