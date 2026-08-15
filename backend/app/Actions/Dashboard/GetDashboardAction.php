<?php

namespace App\Actions\Dashboard;

use App\DTOs\Dashboard\DashboardData;
use App\Models\User;

final class GetDashboardAction
{
    public function execute(User $user): DashboardData
    {
        return new DashboardData(
            user: $user,

            stats: [
                'active_courses' => 0,
                'completed_courses' => 0,
                'learning_hours' => 0,
                'certificates' => 0,
                'current_progress' => 0,
            ],

            currentLearning: [],

            upcomingAssessments: [],

            recentActivity: [],

            weeklyActivity: [
                [
                    'date' => now()->startOfWeek()->format('Y-m-d'),
                    'day' => 'Mon',
                    'minutes' => 0,
                ],
                [
                    'date' => now()->startOfWeek()->addDay()->format('Y-m-d'),
                    'day' => 'Tue',
                    'minutes' => 0,
                ],
                [
                    'date' => now()->startOfWeek()->addDays(2)->format('Y-m-d'),
                    'day' => 'Wed',
                    'minutes' => 0,
                ],
                [
                    'date' => now()->startOfWeek()->addDays(3)->format('Y-m-d'),
                    'day' => 'Thu',
                    'minutes' => 0,
                ],
                [
                    'date' => now()->startOfWeek()->addDays(4)->format('Y-m-d'),
                    'day' => 'Fri',
                    'minutes' => 0,
                ],
                [
                    'date' => now()->startOfWeek()->addDays(5)->format('Y-m-d'),
                    'day' => 'Sat',
                    'minutes' => 0,
                ],
                [
                    'date' => now()->startOfWeek()->addDays(6)->format('Y-m-d'),
                    'day' => 'Sun',
                    'minutes' => 0,
                ],
            ],

            achievements: [],

            aiMentor: [
                'available' => true,

                'message' =>
                    'Your AI mentor is ready to help you improve your diagnostic skills.',

                'recommendation' => null,

                'queries_remaining' => 0,
            ],
        );
    }
}