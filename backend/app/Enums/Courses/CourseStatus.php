<?php

namespace App\Enums\Courses;

enum CourseStatus:string
{
    case DRAFT='draft';

    case REVIEW='review';

    case PUBLISHED='published';

    case ARCHIVED='archived';
}
