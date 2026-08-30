<?php

namespace App\Http\Resources\Api\V1\Dashboard;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    public function toArray(
        Request $request
    ): array {
        return [
            'user' => new UserResource(
                $this->user
            ),

            'stats' => $this->stats,

            'current_learning' =>
                $this->currentLearning,

            'upcoming_assessments' =>
                $this->upcomingAssessments,

            'recent_activity' =>
                $this->recentActivity,

            'weekly_activity' =>
                $this->weeklyActivity,

            'achievements' =>
                $this->achievements,

            'progression' =>
                $this->progression,

            'ai_mentor' =>
                $this->aiMentor,
        ];
    }
}
