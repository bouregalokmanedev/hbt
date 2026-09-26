<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
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
            // Daily challenge definitions (idempotent, action-driven board).
            DailyChallengeSeeder::class,
        ]);
    }
}
