<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * One ready-to-use account per platform role.
 *
 * These are local/demo credentials only. The seeder is idempotent so it can be
 * re-run after a database refresh without creating duplicate users.
 */
final class DemoAccountsSeeder extends Seeder
{
    /**
     * @var array<string, array{first_name: string, last_name: string, username: string, password: string, role: UserRole, bio: string}>
     */
    public const ACCOUNTS = [
        'superadmin@hbtronics.test' => [
            'first_name' => 'Yasmine',
            'last_name' => 'Bensalem',
            'username' => 'super.admin',
            'password' => 'SuperAdmin@2026',
            'role' => UserRole::SUPER_ADMIN,
            'bio' => 'Platform owner with full access to every workspace and setting.',
        ],
        'admin@hbtronics.test' => [
            'first_name' => 'Karim',
            'last_name' => 'Boudiaf',
            'username' => 'admin',
            'password' => 'Admin@2026',
            'role' => UserRole::ADMIN,
            'bio' => 'Operations administrator responsible for courses, people and commerce.',
        ],
        'instructor@hbtronics.test' => [
            'first_name' => 'Amine',
            'last_name' => 'Zerrouki',
            'username' => 'instructor',
            'password' => 'Instructor@2026',
            'role' => UserRole::INSTRUCTOR,
            'bio' => 'Senior automotive diagnostics instructor with 12 years of workshop experience.',
        ],
        'student@hbtronics.test' => [
            'first_name' => 'Sara',
            'last_name' => 'Khelifi',
            'username' => 'student',
            'password' => 'Student@2026',
            'role' => UserRole::STUDENT,
            'bio' => 'Automotive technician building diagnostic and high-voltage skills.',
        ],
        'support@hbtronics.test' => [
            'first_name' => 'Nadia',
            'last_name' => 'Benali',
            'username' => 'support',
            'password' => 'Support@2026',
            'role' => UserRole::SUPPORT,
            'bio' => 'Learner support specialist for tickets, account recovery and course access.',
        ],
        'sales@hbtronics.test' => [
            'first_name' => 'Yacine',
            'last_name' => 'Mansouri',
            'username' => 'sales',
            'password' => 'Sales@2026',
            'role' => UserRole::SALES,
            'bio' => 'Sales and partnerships lead for training programmes and corporate cohorts.',
        ],
    ];

    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('Demo accounts are disabled in production.');

            return;
        }

        // Roles and the default staff permission sets must exist before the
        // accounts are assigned, especially for Admin and Support.
        $this->call(AccessControlSeeder::class);

        foreach (self::ACCOUNTS as $email => $account) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'first_name' => $account['first_name'],
                    'last_name' => $account['last_name'],
                    'username' => $account['username'],
                    'password' => Hash::make($account['password']),
                    'bio' => $account['bio'],
                    'phone' => '+213 555 010 000',
                    'country' => 'DZ',
                    'language' => 'en',
                    'timezone' => 'Africa/Algiers',
                    'status' => UserStatus::ACTIVE->value,
                    'email_verified_at' => now(),
                ],
            );

            $user->syncRoles([$account['role']->value]);
        }

        $this->command?->info('Seeded one active demo account for each platform role.');
    }
}
