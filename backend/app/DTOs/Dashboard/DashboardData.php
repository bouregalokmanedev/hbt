<?php

namespace App\DTOs\Dashboard;

use App\Models\User;

final readonly class DashboardData
{
    public function __construct(
        public User $user,
        public array $stats,
        public array $currentLearning,
        public array $upcomingAssessments,
        public array $recentActivity,
        public array $weeklyActivity,
        public array $achievements,
        public array $progression,
        public array $aiMentor,
    ) {}
}
