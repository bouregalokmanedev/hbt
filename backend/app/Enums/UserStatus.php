<?php

namespace App\Enums;

enum UserStatus: string
{
    case ACTIVE = 'active';

    case PENDING = 'pending';

    case INACTIVE = 'inactive';

    case SUSPENDED = 'suspended';
}