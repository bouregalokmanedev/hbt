<?php

namespace App\Domains\AI\Enums;

enum MentorMemoryType: string
{
    case PREFERENCE = 'preference';
    case STRENGTH = 'strength';
    case WEAKNESS = 'weakness';
    case KNOWLEDGE = 'knowledge';
    case GOAL = 'goal';
    case MISCONCEPTION = 'misconception';
}