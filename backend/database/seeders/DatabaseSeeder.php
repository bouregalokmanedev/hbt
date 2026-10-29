<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Roles, permissions and the default Admin/Support permission sets.
            AccessControlSeeder::class,
            RolePermissionSeeder::class,
            // Lookup data for plans/subscriptions UI (idempotent).
            SubscriptionFeaturesSeeder::class,
            // Simulator garage vehicles for the instructor builder (idempotent).
            SimulatorVehicleSeeder::class,
            // Default data packs per vehicle/tool so fresh installs have publishable environments (idempotent).
            SimulatorDataPackSeeder::class,
            // Creates a demo quiz + assessment on the first course when one
            // exists; otherwise it skips with a console warning.
            AutomotiveAssessmentSeeder::class,
            // Demo course + users for local dev only:
            // php artisan db:seed --class=ExampleCourseSeeder
            // Public demo bootcamps and their authored curriculum/schedules.
            ExampleBootcampsSeeder::class,
            // One active login per role, plus three published demo courses
            // authored by the demo instructor and enrolled for the demo student.
            DemoAccountsSeeder::class,
            DemoCoursesSeeder::class,
            // Daily challenge definitions (idempotent, action-driven board).
            DailyChallengeSeeder::class,
        ]);
    }
}
