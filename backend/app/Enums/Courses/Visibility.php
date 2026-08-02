<?php

namespace App\Enums\Courses;

enum Visibility:string
{
    case PUBLIC='public';

    case PRIVATE='private';

    case UNLISTED='unlisted';
}