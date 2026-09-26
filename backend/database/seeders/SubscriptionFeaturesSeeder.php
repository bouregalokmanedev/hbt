<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Payments\Models\SubscriptionFeature;

class SubscriptionFeaturesSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            ['key' => 'course_access', 'name' => 'Course access', 'description' => 'Number of courses accessible via subscription', 'type' => 'string'],
            ['key' => 'certificate_access', 'name' => 'Certificate access', 'description' => 'Can earn and download certificates', 'type' => 'boolean'],
            ['key' => 'assessment_access', 'name' => 'Assessment access', 'description' => 'Can attempt assessments', 'type' => 'boolean'],
            ['key' => 'ai_mentor', 'name' => 'AI Mentor', 'description' => 'Access to AI diagnostic mentor', 'type' => 'boolean'],
            ['key' => 'advanced_analytics', 'name' => 'Advanced analytics', 'description' => 'Detailed learning analytics', 'type' => 'boolean'],
            ['key' => 'download_content', 'name' => 'Download content', 'description' => 'Offline course downloads', 'type' => 'boolean'],
            ['key' => 'priority_support', 'name' => 'Priority support', 'description' => 'Faster support response', 'type' => 'boolean'],
            ['key' => 'max_enrollments', 'name' => 'Max enrollments', 'description' => 'Concurrent enrollment limit', 'type' => 'integer'],
            ['key' => 'max_simulator_sessions_monthly', 'name' => 'Monthly simulator sessions', 'description' => 'Simulator sessions per calendar month (unlimited when the plan omits it)', 'type' => 'integer'],
        ];

        foreach ($features as $feature) {
            SubscriptionFeature::updateOrCreate(['key' => $feature['key']], $feature);
        }
    }
}
