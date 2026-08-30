<?php

namespace App\Domains\AI\Enums;

enum MentorMessageStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
}