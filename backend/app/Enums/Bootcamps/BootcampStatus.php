<?php

namespace App\Enums\Bootcamps;

enum BootcampStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';
}
