<?php

namespace App\Domains\Students\Enums;

enum DifficultyPreference: string
{
    case ADAPTIVE = 'adaptive';
    case BEGINNER = 'beginner';
    case INTERMEDIATE = 'intermediate';
    case ADVANCED = 'advanced';
}