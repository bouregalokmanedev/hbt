<?php

namespace App\Domains\Admin\AccessControl;

use App\Enums\UserRole;

/**
 * Canonical permission catalog for the platform.
 *
 * Authentication → Role → Permission → Policy → Domain Action → Audit.
 *
 * No new admin capability should be introduced as a bare
 * `$user->hasRole(...)` check; register a permission here,
 * assign it in AccessControlSeeder, and enforce it via
 * middleware, policies, or explicit permission checks.
 */
final class AdminPermissions
{
    public const USERS_VIEW = 'users.view';
    public const USERS_CREATE = 'users.create';
    public const USERS_UPDATE = 'users.update';
    public const USERS_DELETE = 'users.delete';
    public const USERS_SUSPEND = 'users.suspend';
    public const USERS_VERIFY = 'users.verify';
    public const USERS_SESSIONS_REVOKE = 'users.sessions.revoke';
    public const USERS_PASSWORD_RESET = 'users.password.reset';
    public const USERS_ROLE_ASSIGN = 'users.role.assign';

    public const ROLES_VIEW = 'roles.view';
    public const ROLES_MANAGE = 'roles.manage';

    public const COURSES_VIEW = 'courses.view';
    public const COURSES_CREATE = 'courses.create';
    public const COURSES_UPDATE = 'courses.update';
    public const COURSES_DELETE = 'courses.delete';
    public const COURSES_PUBLISH = 'courses.publish';
    public const COURSES_ARCHIVE = 'courses.archive';
    public const COURSES_MODERATE = 'courses.moderate';
    public const COURSES_INSTRUCTOR_REASSIGN = 'courses.instructor.reassign';

    public const STUDENTS_VIEW = 'students.view';
    public const STUDENTS_LEARNING_VIEW = 'students.learning.view';

    public const ENROLLMENTS_VIEW = 'enrollments.view';
    public const ENROLLMENTS_MANAGE = 'enrollments.manage';

    public const CERTIFICATES_VIEW = 'certificates.view';
    public const CERTIFICATES_VERIFY = 'certificates.verify';
    public const CERTIFICATES_REVOKE = 'certificates.revoke';
    public const CERTIFICATES_REISSUE = 'certificates.reissue';

    public const PAYMENTS_VIEW = 'payments.view';
    public const REFUNDS_MANAGE = 'refunds.manage';
    public const PAYOUTS_MANAGE = 'payouts.manage';
    public const SUBSCRIPTIONS_MANAGE = 'subscriptions.manage';
    public const SUBSCRIPTIONS_GRANT = 'subscriptions.grant';

    public const ANALYTICS_VIEW = 'analytics.view';

    public const ANNOUNCEMENTS_MANAGE = 'announcements.manage';
    public const NOTIFICATIONS_MANAGE = 'notifications.manage';

    public const SUPPORT_VIEW = 'support.view';
    public const SUPPORT_REPLY = 'support.reply';
    public const SUPPORT_ESCALATE = 'support.escalate';

    public const REVIEWS_MODERATE = 'reviews.moderate';

    public const SECURITY_VIEW = 'security.view';

    public const AUDIT_VIEW = 'audit.view';

    public const SYSTEM_MANAGE = 'system.manage';
    /**
     * Every permission known to the platform, grouped by domain.
     *
     * @return array<string, list<string>>
     */
    public static function grouped(): array
    {
        return [
            'Users' => [
                self::USERS_VIEW,
                self::USERS_CREATE,
                self::USERS_UPDATE,
                self::USERS_DELETE,
                self::USERS_SUSPEND,
                self::USERS_VERIFY,
                self::USERS_SESSIONS_REVOKE,
                self::USERS_PASSWORD_RESET,
                self::USERS_ROLE_ASSIGN,
            ],
            'Roles' => [
                self::ROLES_VIEW,
                self::ROLES_MANAGE,
            ],
            'Courses' => [
                self::COURSES_VIEW,
                self::COURSES_CREATE,
                self::COURSES_UPDATE,
                self::COURSES_DELETE,
                self::COURSES_PUBLISH,
                self::COURSES_ARCHIVE,
                self::COURSES_MODERATE,
                self::COURSES_INSTRUCTOR_REASSIGN,
            ],
            'Students' => [
                self::STUDENTS_VIEW,
                self::STUDENTS_LEARNING_VIEW,
            ],
            'Enrollments' => [
                self::ENROLLMENTS_VIEW,
                self::ENROLLMENTS_MANAGE,
            ],
            'Certificates' => [
                self::CERTIFICATES_VIEW,
                self::CERTIFICATES_VERIFY,
                self::CERTIFICATES_REVOKE,
                self::CERTIFICATES_REISSUE,
            ],
            'Commerce' => [
                self::PAYMENTS_VIEW,
                self::REFUNDS_MANAGE,
                self::PAYOUTS_MANAGE,
                self::SUBSCRIPTIONS_MANAGE,
                self::SUBSCRIPTIONS_GRANT,
            ],
            'Analytics' => [
                self::ANALYTICS_VIEW,
            ],
            'Communication' => [
                self::ANNOUNCEMENTS_MANAGE,
                self::NOTIFICATIONS_MANAGE,
            ],
            'Support' => [
                self::SUPPORT_VIEW,
                self::SUPPORT_REPLY,
                self::SUPPORT_ESCALATE,
            ],
            'Moderation' => [
                self::REVIEWS_MODERATE,
            ],
            'Security' => [
                self::SECURITY_VIEW,
            ],
            'Audit' => [
                self::AUDIT_VIEW,
            ],
            'System' => [
                self::SYSTEM_MANAGE,
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return array_values(array_unique(array_merge(...array_values(self::grouped()))));
    }

    /**
     * Default permissions granted to a role by the seeder.
     *
     * Super Admin implicitly holds everything (synced to all).
     * Destructive / platform-level capabilities (system, roles,
     * commerce money movement, certificate revocation, user
     * deletion, role assignment) stay Super Admin-only.
     *
     * @return list<string>
     */
    public static function defaultsFor(string $role): array
    {
        return match ($role) {
            UserRole::SUPER_ADMIN->value => self::all(),
            UserRole::ADMIN->value => [
                self::USERS_VIEW,
                self::USERS_CREATE,
                self::USERS_UPDATE,
                self::USERS_SUSPEND,
                self::USERS_VERIFY,
                self::USERS_SESSIONS_REVOKE,
                self::USERS_PASSWORD_RESET,
                self::COURSES_VIEW,
                self::COURSES_UPDATE,
                self::COURSES_PUBLISH,
                self::COURSES_ARCHIVE,
                self::COURSES_MODERATE,
                self::STUDENTS_VIEW,
                self::STUDENTS_LEARNING_VIEW,
                self::ENROLLMENTS_VIEW,
                self::ENROLLMENTS_MANAGE,
                self::CERTIFICATES_VIEW,
                self::CERTIFICATES_VERIFY,
                self::ANALYTICS_VIEW,
                self::ANNOUNCEMENTS_MANAGE,
                self::NOTIFICATIONS_MANAGE,
                self::SUPPORT_VIEW,
                self::SUPPORT_REPLY,
                self::SUPPORT_ESCALATE,
                self::REVIEWS_MODERATE,
                self::SECURITY_VIEW,
                self::AUDIT_VIEW,
            ],
            UserRole::SUPPORT->value => [
                self::USERS_VIEW,
                self::STUDENTS_VIEW,
                self::STUDENTS_LEARNING_VIEW,
                self::ENROLLMENTS_VIEW,
                self::CERTIFICATES_VIEW,
                self::CERTIFICATES_VERIFY,
                self::SUPPORT_VIEW,
                self::SUPPORT_REPLY,
            ],
            default => [],
        };
    }
}
