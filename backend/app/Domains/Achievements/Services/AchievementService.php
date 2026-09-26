<?php

namespace App\Domains\Achievements\Services;

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Simulator\Models\SimulatorResult;
use App\Models\CourseFeedback;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Services\StudentProgressionService;

class AchievementService
{
    public function sync(User $user): array
    {
        $firstPassed = AssessmentAttempt::where('user_id', $user->id)->where('passed', true)->orderBy('attempt_number')->first();
        $hasProRole = $user->getRoleNames()->map(fn ($role) => strtolower((string) $role))->intersect(['pro', 'premium', 'subscriber'])->isNotEmpty();

        $completedCourses = Enrollment::where('user_id', $user->id)->whereNotNull('completed_at')->count();
        $passedQuizzes = QuizAttempt::where('user_id', $user->id)->where('passed', true)->count();
        $distinctLessonDays = LessonProgress::where('user_id', $user->id)->get(['updated_at'])->map(fn ($p) => $p->updated_at?->toDateString())->filter()->unique()->count();
        $distinctLessons = LessonProgress::where('user_id', $user->id)->distinct('lesson_id')->count('lesson_id');
        $reviewCount = CourseFeedback::where('user_id', $user->id)->count();
        $hasPrecision = AssessmentAttempt::where('user_id', $user->id)->where('score', 100)->exists();
        $hasTrailblazer = Enrollment::where('user_id', $user->id)->whereNotNull('completed_at')->whereNotNull('enrolled_at')->get()->contains(fn (Enrollment $e) => $e->completed_at && $e->enrolled_at && $e->completed_at->diffInDays($e->enrolled_at) <= 14);

        $passedDiagnostics = DiagnosticScenarioAttempt::where('user_id', $user->id)->where('passed', true)->count();
        $simResultsCount = SimulatorResult::where('user_id', $user->id)->count();
        $simDistinctTools = SimulatorResult::where('user_id', $user->id)->distinct('tool')->count('tool');
        $hasSimAce = SimulatorResult::where('user_id', $user->id)->where('score', '>=', 90)->exists();

        $earned = [
            'member' => true,
            'pro' => $hasProRole,
            'striker' => $firstPassed && $firstPassed->attempt_number === 1,
            'elite' => AssessmentAttempt::where('user_id', $user->id)->where('score', '>=', 90)->exists(),
            'learner' => $completedCourses >= 1,
            'owner' => filled($user->first_name) && filled($user->last_name) && filled($user->username) && filled($user->phone) && filled($user->country) && filled($user->bio),
            'pathfinder' => $completedCourses >= 3,
            'scholar' => $passedQuizzes >= 5,
            'consistent' => $distinctLessonDays >= 7,
            'trailblazer' => $hasTrailblazer,
            'mentor' => $reviewCount >= 10,
            'precision' => $hasPrecision,
            'explorer' => $distinctLessons >= 5,
            'diagnostic-starter' => $passedDiagnostics >= 1,
            'diagnostic-solver' => $passedDiagnostics >= 5,
            'bench-starter' => $simResultsCount >= 1,
            'sim-explorer' => $simDistinctTools >= 5,
            'bench-ace' => $hasSimAce,
            'rising-star' => false, // computed after counting
        ];
        // rising-star: at least 3 other badges earned
        $earned['rising-star'] = collect($earned)->filter(fn ($v, $k) => $k !== 'rising-star' && $v)->count() >= 3;
        foreach ($earned as $badge => $hasEarned) if ($hasEarned) {
            $achievement = UserAchievement::firstOrCreate(['user_id' => $user->id, 'badge' => $badge], ['earned_at' => now()]);
            if ($achievement->wasRecentlyCreated) {
                app(StudentNotificationService::class)->send($user, 'achievement', 'New badge unlocked', "You earned the {$badge} badge.", '/achievements', "badge:{$badge}");
            }
            $xp = StudentProgressionService::badgeXp($badge);
            app(StudentProgressionService::class)->award($user, 'badge_earned', $xp, $xp, "badge:{$badge}", ['badge' => $badge, 'label' => ucfirst(str_replace('-', ' ', $badge))]);
        }
        $targets = [
            'member' => 1, 'pro' => 1, 'striker' => 1, 'elite' => 1, 'learner' => 1, 'owner' => 1,
            'pathfinder' => 3, 'scholar' => 5, 'consistent' => 7, 'trailblazer' => 1,
            'mentor' => 10, 'precision' => 1, 'explorer' => 5,
            'diagnostic-starter' => 1, 'diagnostic-solver' => 5, 'bench-starter' => 1, 'sim-explorer' => 5, 'bench-ace' => 1,
            'rising-star' => 3,
        ];
        $progressMap = [
            'member' => 1, 'pro' => $hasProRole ? 1 : 0, 'striker' => $earned['striker'] ? 1 : 0, 'elite' => $earned['elite'] ? 1 : 0,
            'learner' => min($completedCourses, 1), 'owner' => $earned['owner'] ? 1 : 0,
            'pathfinder' => min($completedCourses, 3), 'scholar' => min($passedQuizzes, 5),
            'consistent' => min($distinctLessonDays, 7), 'trailblazer' => $earned['trailblazer'] ? 1 : 0,
            'mentor' => min($reviewCount, 10), 'precision' => $earned['precision'] ? 1 : 0,
            'explorer' => min($distinctLessons, 5),
            'diagnostic-starter' => min($passedDiagnostics, 1), 'diagnostic-solver' => min($passedDiagnostics, 5),
            'bench-starter' => min($simResultsCount, 1), 'sim-explorer' => min($simDistinctTools, 5), 'bench-ace' => $earned['bench-ace'] ? 1 : 0,
            'rising-star' => min(collect($earned)->filter(fn ($v, $k) => $k !== 'rising-star' && $v)->count(), 3),
        ];

        return collect([
            ['id'=>'member','title'=>'Member','description'=>'Create your HBT Learning account.','icon'=>'●','completed'=>$earned['member']],
            ['id'=>'pro','title'=>'Pro','description'=>'Subscribe to an active HBT Pro plan.','icon'=>'✦','completed'=>$earned['pro']],
            ['id'=>'striker','title'=>'Striker','description'=>'Pass an assessment on your first attempt.','icon'=>'⚡','completed'=>$earned['striker']],
            ['id'=>'elite','title'=>'Elite','description'=>'Score 90% or more on an assessment.','icon'=>'★','completed'=>$earned['elite']],
            ['id'=>'learner','title'=>'Learner','description'=>'Complete your first course.','icon'=>'▣','completed'=>$earned['learner']],
            ['id'=>'owner','title'=>'Owner','description'=>'Complete your profile with contact details and a bio.','icon'=>'◆','completed'=>$earned['owner']],
            ['id'=>'pathfinder','title'=>'Pathfinder','description'=>'Complete three courses to unlock this badge.','icon'=>'✦','completed'=>$earned['pathfinder']],
            ['id'=>'scholar','title'=>'Scholar','description'=>'Pass five quizzes to unlock this badge.','icon'=>'◈','completed'=>$earned['scholar']],
            ['id'=>'consistent','title'=>'Consistent','description'=>'Learn on seven different days.','icon'=>'◉','completed'=>$earned['consistent']],
            ['id'=>'trailblazer','title'=>'Trailblazer','description'=>'Finish your first course within 14 days.','icon'=>'▲','completed'=>$earned['trailblazer']],
            ['id'=>'mentor','title'=>'Mentor','description'=>'Share ten helpful course reviews.','icon'=>'☀','completed'=>$earned['mentor']],
            ['id'=>'precision','title'=>'Precision','description'=>'Score 100% on an assessment.','icon'=>'◎','completed'=>$earned['precision']],
            ['id'=>'explorer','title'=>'Explorer','description'=>'Open five different course lessons.','icon'=>'◌','completed'=>$earned['explorer']],
            ['id'=>'diagnostic-starter','title'=>'First Diagnosis','description'=>'Complete your first diagnostic scenario.','icon'=>'▸','completed'=>$earned['diagnostic-starter']],
            ['id'=>'diagnostic-solver','title'=>'Problem Solver','description'=>'Pass five diagnostic scenarios.','icon'=>'⬢','completed'=>$earned['diagnostic-solver']],
            ['id'=>'bench-starter','title'=>'Bench Starter','description'=>'Complete your first simulator bench.','icon'=>'⬣','completed'=>$earned['bench-starter']],
            ['id'=>'sim-explorer','title'=>'Lab Explorer','description'=>'Try all five simulator labs.','icon'=>'⬔','completed'=>$earned['sim-explorer']],
            ['id'=>'bench-ace','title'=>'Bench Ace','description'=>'Score 90% or more in any simulator bench.','icon'=>'⬥','completed'=>$earned['bench-ace']],
            ['id'=>'rising-star','title'=>'Rising Star','description'=>'Earn three badges to unlock this badge.','icon'=>'✹','completed'=>$earned['rising-star']],
        ])->map(fn (array $badge) => $badge + ['progress' => $progressMap[$badge['id']] ?? 0, 'target' => $targets[$badge['id']] ?? 1])->all();
    }
}
