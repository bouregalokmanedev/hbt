<?php

namespace App\Domains\AI\Enums;

enum MentorLearningLevel: string
{
    case BEGINNER = 'beginner';
    case DEVELOPING = 'developing';
    case INTERMEDIATE = 'intermediate';
    case ADVANCED = 'advanced';
}