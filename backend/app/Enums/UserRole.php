<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'Super Admin';

    case ADMIN = 'Admin';

    case INSTRUCTOR = 'Instructor';

    case STUDENT = 'Student';

    case SUPPORT = 'Support';
}