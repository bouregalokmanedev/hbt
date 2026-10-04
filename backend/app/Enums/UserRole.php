<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'Super Admin';
    case ADMIN = 'Admin';
    case INSTRUCTOR = 'Instructor';
    case STUDENT = 'Student';
    case SUPPORT = 'Support';

    /**
     * Roles that make up platform staff: the people who run and teach on the
     * platform, as opposed to learners. Used for staff-only spaces and for
     * audience scoping on broadcasts.
     *
     * @return list<string>
     */
    public static function staff(): array
    {
        return [
            self::ADMIN->value,
            self::SUPER_ADMIN->value,
            self::SUPPORT->value,
            self::INSTRUCTOR->value,
        ];
    }
}