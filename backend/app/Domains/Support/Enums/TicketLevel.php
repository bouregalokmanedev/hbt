<?php

namespace App\Domains\Support\Enums;

enum TicketLevel: string
{
    case SUPPORT = 'support';
    case ADMIN = 'admin';
    case SUPER_ADMIN = 'super_admin';
}
