<?php

namespace App\Domains\Students\Enums;

enum ProfileVisibility: string
{
    case PRIVATE = 'private';
    case ENROLLED_COURSES = 'enrolled_courses';
    case PUBLIC = 'public';
}