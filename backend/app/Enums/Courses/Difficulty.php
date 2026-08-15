<?php

namespace App\Enums\Courses;


enum Difficulty:string
{
    case BEGINNER='beginner';

    case INTERMEDIATE='intermediate';

    case ADVANCED='advanced';

    case ALL_LEVELS='all levels';
}