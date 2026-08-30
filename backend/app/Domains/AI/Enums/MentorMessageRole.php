<?php

namespace App\Domains\AI\Enums;

enum MentorMessageRole: string
{
    case SYSTEM = 'system';
    case USER = 'user';
    case ASSISTANT = 'assistant';
}