<?php

namespace App\Domains\Assessments\Enums;

enum AssessmentStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
}