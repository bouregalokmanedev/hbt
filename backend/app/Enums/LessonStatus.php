<?php

namespace App\Enums;

enum LessonStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
}