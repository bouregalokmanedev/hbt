<?php

namespace App\Domains\AI\Enums;

enum MentorAIRequestType: string
{
    case MESSAGE = 'message';
    case STREAM = 'stream';
}