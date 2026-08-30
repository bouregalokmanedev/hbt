<?php

namespace App\Domains\Achievements\Services;

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\Enrollment;
use App\Models\User;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Services\StudentProgressionService;

class AchievementService
{
    public function sync(User $user): array
    {
        $firstPassed = AssessmentAttempt::where('user_id', $user->id)->where('passed', true)->orderBy('attempt_number')->first();
        $hasProRole = $user->getRoleNames()->map(fn ($role) => strtolower((string) $role))->intersect(['pro', 'premium', 'subscriber'])->isNotEmpty();
        $earned = ['member' => true, 'pro' => $hasProRole, 'striker' => $firstPassed && $firstPassed->attempt_number === 1, 'elite' => AssessmentAttempt::where('user_id', $user->id)->where('score', '>=', 90)->exists(), 'learner' => Enrollment::where('user_id', $user->id)->whereNotNull('completed_at')->exists(), 'owner' => filled($user->first_name) && filled($user->last_name) && filled($user->username) && filled($user->phone) && filled($user->country) && filled($user->bio)];
        foreach ($earned as $badge => $hasEarned) if ($hasEarned) {
            $achievement = UserAchievement::firstOrCreate(['user_id' => $user->id, 'badge' => $badge], ['earned_at' => now()]);
            if ($achievement->wasRecentlyCreated) {
                app(StudentNotificationService::class)->send($user, 'achievement', 'New badge unlocked', "You earned the {$badge} badge.", '/achievements', "badge:{$badge}");
            }
            $xp = StudentProgressionService::badgeXp($badge);
            app(StudentProgressionService::class)->award($user, 'badge_earned', $xp, $xp, "badge:{$badge}", ['badge' => $badge, 'label' => ucfirst(str_replace('-', ' ', $badge))]);
        }
        return collect([
            ['id'=>'member','title'=>'Member','description'=>'Create your HBT Learning account.','icon'=>'●','completed'=>$earned['member']], ['id'=>'pro','title'=>'Pro','description'=>'Subscribe to an active HBT Pro plan.','icon'=>'✦','completed'=>$earned['pro']], ['id'=>'striker','title'=>'Striker','description'=>'Pass an assessment on your first attempt.','icon'=>'⚡','completed'=>$earned['striker']], ['id'=>'elite','title'=>'Elite','description'=>'Score 90% or more on an assessment.','icon'=>'★','completed'=>$earned['elite']], ['id'=>'learner','title'=>'Learner','description'=>'Complete your first course.','icon'=>'▣','completed'=>$earned['learner']], ['id'=>'owner','title'=>'Owner','description'=>'Complete your profile with contact details and a bio.','icon'=>'◆','completed'=>$earned['owner']], ['id'=>'pathfinder','title'=>'Pathfinder','description'=>'Complete three courses to unlock this badge.','icon'=>'✦','completed'=>false], ['id'=>'scholar','title'=>'Scholar','description'=>'Pass five quizzes to unlock this badge.','icon'=>'◈','completed'=>false], ['id'=>'consistent','title'=>'Consistent','description'=>'Learn on seven different days.','icon'=>'◉','completed'=>false], ['id'=>'trailblazer','title'=>'Trailblazer','description'=>'Finish your first course within 14 days.','icon'=>'▲','completed'=>false], ['id'=>'mentor','title'=>'Mentor','description'=>'Share ten helpful course reviews.','icon'=>'☀','completed'=>false], ['id'=>'precision','title'=>'Precision','description'=>'Score 100% on an assessment.','icon'=>'◎','completed'=>false], ['id'=>'explorer','title'=>'Explorer','description'=>'Open five different course lessons.','icon'=>'◌','completed'=>false], ['id'=>'rising-star','title'=>'Rising Star','description'=>'Earn three badges to unlock this badge.','icon'=>'✹','completed'=>false],
        ])->map(fn (array $badge) => $badge + ['progress' => $badge['completed'] ? 1 : 0, 'target' => 1])->all();
    }
}
