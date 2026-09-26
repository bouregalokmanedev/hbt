<?php

namespace App\Domains\Support\Enums;

enum TicketStatus: string
{
    case OPEN = 'open';
    case PENDING = 'pending';
    case RESOLVED = 'resolved';
    case CLOSED = 'closed';
}
