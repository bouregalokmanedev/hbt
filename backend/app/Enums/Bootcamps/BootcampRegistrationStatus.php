<?php

namespace App\Enums\Bootcamps;

enum BootcampRegistrationStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case CANCELLED = 'cancelled';
}
