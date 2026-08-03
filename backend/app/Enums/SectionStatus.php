<?php

namespace App\Enums;

enum SectionStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
}