<?php

namespace App\Domains\Assignments\Enums;

enum AssignmentStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
}
