<?php

namespace App\Domains\AI\Enums;

enum MentorConversationStatus: string
{
    case ACTIVE = 'active';
    case ARCHIVED = 'archived';
    case CLOSED = 'closed';
}