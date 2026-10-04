<?php

namespace App\Domains\Achievements\Services;

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Challenges\Models\DailyChallengeAssignment;
use App\Domains\Challenges\Models\DailyChallengeRival;
use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Domains\Simulator\Models\SimulatorResult;
use App\Models\Certificate;
use App\Models\CourseFeedback;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Favorite;
use App\Models\LessonNote;
use App\Models\LessonProgress;
use App\Models\SectionProgress;
use App\Models\User;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Services\StudentProgressionService;

class AchievementService
{
    /**
     * Badges that grant extra simulator sessions when unlocked:
     * one unlocked badge = +1 session, two = +2, three = +3.
     */
    public const SIMULATOR_SESSION_BADGES = ['bench-starter', 'sim-explorer', 'bench-ace'];

    /** Hard ceiling on the badge-driven simulator session bonus. */
    public const MAX_SIMULATOR_SESSION_BONUS = 3;

    /**
     * Extra simulator sessions unlocked so far (0..MAX_SIMULATOR_SESSION_BONUS).
     * Read by the entitlement service to widen the monthly quota.
     */
    public function simulatorSessionBonus(User $user): int
    {
        $unlocked = UserAchievement::query()
            ->where('user_id', $user->id)
            ->whereIn('badge', self::SIMULATOR_SESSION_BADGES)
            ->count();

        return min($unlocked, self::MAX_SIMULATOR_SESSION_BONUS);
    }

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

        $mentorMessages = MentorMessage::query()
            ->where('role', MentorMessageRole::USER->value)
            ->whereHas('conversation', fn ($q) => $q->where('user_id', $user->id))
            ->count();
        $mentorConversations = MentorConversation::where('user_id', $user->id)->count();
        $mentorHelpful = MentorMessageFeedback::where('user_id', $user->id)
            ->where('rating', MentorFeedbackRating::POSITIVE->value)
            ->count();

        $profile = StudentProgressionProfile::query()
            ->where('user_id', $user->id)
            ->first(['level', 'longest_streak']);
        $level = (int) ($profile?->level ?? 1);
        $longestStreak = (int) ($profile?->longest_streak ?? 0);

        $studyHours = (int) floor((int) CourseProgress::where('user_id', $user->id)->sum('time_spent') / 3600);
        $sectionsCompleted = SectionProgress::where('user_id', $user->id)->whereNotNull('completed_at')->count();
        $favouriteCourses = Favorite::where('user_id', $user->id)->where('favoritable_type', Favorite::TYPE_COURSE)->count();
        $perfectQuiz = QuizAttempt::where('user_id', $user->id)->whereNotNull('percentage')->where('percentage', '>=', 100)->exists();
        $passedAssessments = AssessmentAttempt::where('user_id', $user->id)->where('passed', true)->count();
        $referrals = User::where('referred_by', $user->id)->count();
        $challengesCompleted = DailyChallengeAssignment::where('user_id', $user->id)->whereIn('status', ['completed', 'claimed'])->count();
        $rivalsSent = DailyChallengeRival::where('challenger_id', $user->id)->count();
        $peerBonusesGiven = StudentXpTransaction::where('user_id', $user->id)
            ->where('dedupe_key', 'like', "peer-bonus:{$user->id}:%")
            ->count();
        $lessonNotes = LessonNote::where('user_id', $user->id)->count();
        $certificates = Certificate::where('user_id', $user->id)->count();

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
            'ai-first-chat' => $mentorMessages >= 1,
            'ai-conversationalist' => $mentorMessages >= 50,
            'ai-confidant' => $mentorConversations >= 5,
            'ai-scholar' => $mentorHelpful >= 10,
            'on-fire' => $longestStreak >= 14,
            'unstoppable' => $longestStreak >= 30,
            'rising-level' => $level >= 5,
            'veteran' => $level >= 7,
            'graduate' => $completedCourses >= 5,
            'marathoner' => $studyHours >= 50,
            'thorough' => $sectionsCompleted >= 25,
            'collector' => $favouriteCourses >= 10,
            'quiz-ace' => $perfectQuiz,
            'proven' => $passedAssessments >= 10,
            'diagnostic-master' => $passedDiagnostics >= 15,
            'ambassador' => $referrals >= 3,
            'challenger' => $challengesCompleted >= 10,
            'rivalry' => $rivalsSent >= 5,
            'good-samaritan' => $peerBonusesGiven >= 5,
            'curator' => $lessonNotes >= 10,
            'credentialed' => $certificates >= 5,
            'rising-star' => false,      // computed after counting
            'badge-hoarder' => false,    // only knowable once the rest are persisted
        ];
        // rising-star: at least 3 other badges earned
        $earned['rising-star'] = collect($earned)->filter(fn ($v, $k) => ! in_array($k, ['rising-star', 'badge-hoarder'], true) && $v)->count() >= 3;

        $mint = function (string $badge) use ($user): void {
            $achievement = UserAchievement::firstOrCreate(['user_id' => $user->id, 'badge' => $badge], ['earned_at' => now()]);
            if ($achievement->wasRecentlyCreated) {
                app(StudentNotificationService::class)->send($user, 'achievement', 'New badge unlocked', "You earned the {$badge} badge.", '/achievements', "badge:{$badge}");
            }
            $xp = StudentProgressionService::badgeXp($badge);
            app(StudentProgressionService::class)->award($user, 'badge_earned', $xp, $xp, "badge:{$badge}", ['badge' => $badge, 'label' => ucfirst(str_replace('-', ' ', $badge))]);
        };

        foreach ($earned as $badge => $hasEarned) if ($hasEarned) $mint($badge);

        // badge-hoarder counts the badges minted above, so it can only be settled afterwards.
        $ownedBadges = UserAchievement::where('user_id', $user->id)->count();
        if ($ownedBadges >= 15) {
            $earned['badge-hoarder'] = true;
            $mint('badge-hoarder');
            $ownedBadges = UserAchievement::where('user_id', $user->id)->count();
        }
        $targets = [
            'member' => 1, 'pro' => 1, 'striker' => 1, 'elite' => 1, 'learner' => 1, 'owner' => 1,
            'pathfinder' => 3, 'scholar' => 5, 'consistent' => 7, 'trailblazer' => 1,
            'mentor' => 10, 'precision' => 1, 'explorer' => 5,
            'diagnostic-starter' => 1, 'diagnostic-solver' => 5, 'bench-starter' => 1, 'sim-explorer' => 5, 'bench-ace' => 1,
            'ai-first-chat' => 1, 'ai-conversationalist' => 50, 'ai-confidant' => 5, 'ai-scholar' => 10,
            'on-fire' => 14, 'unstoppable' => 30, 'rising-level' => 5, 'veteran' => 7,
            'graduate' => 5, 'marathoner' => 50, 'thorough' => 25, 'collector' => 10,
            'quiz-ace' => 1, 'proven' => 10, 'diagnostic-master' => 15,
            'ambassador' => 3, 'challenger' => 10, 'rivalry' => 5, 'good-samaritan' => 5,
            'curator' => 10, 'credentialed' => 5, 'badge-hoarder' => 15,
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
            'ai-first-chat' => min($mentorMessages, 1), 'ai-conversationalist' => min($mentorMessages, 50),
            'ai-confidant' => min($mentorConversations, 5), 'ai-scholar' => min($mentorHelpful, 10),
            'on-fire' => min($longestStreak, 14), 'unstoppable' => min($longestStreak, 30),
            'rising-level' => min($level, 5), 'veteran' => min($level, 7),
            'graduate' => min($completedCourses, 5), 'marathoner' => min($studyHours, 50),
            'thorough' => min($sectionsCompleted, 25), 'collector' => min($favouriteCourses, 10),
            'quiz-ace' => $perfectQuiz ? 1 : 0, 'proven' => min($passedAssessments, 10),
            'diagnostic-master' => min($passedDiagnostics, 15),
            'ambassador' => min($referrals, 3), 'challenger' => min($challengesCompleted, 10),
            'rivalry' => min($rivalsSent, 5), 'good-samaritan' => min($peerBonusesGiven, 5),
            'curator' => min($lessonNotes, 10), 'credentialed' => min($certificates, 5),
            'badge-hoarder' => min($ownedBadges, 15),
            'rising-star' => min(collect($earned)->filter(fn ($v, $k) => ! in_array($k, ['rising-star', 'badge-hoarder'], true) && $v)->count(), 3),
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
            ['id'=>'ai-first-chat','title'=>'First Contact','description'=>'Send your first message to the AI mentor.','icon'=>'✧','completed'=>$earned['ai-first-chat']],
            ['id'=>'ai-conversationalist','title'=>'Conversationalist','description'=>'Send fifty messages to the AI mentor.','icon'=>'❋','completed'=>$earned['ai-conversationalist']],
            ['id'=>'ai-confidant','title'=>'Confidant','description'=>'Start five separate AI mentor conversations.','icon'=>'◇','completed'=>$earned['ai-confidant']],
            ['id'=>'ai-scholar','title'=>'AI Scholar','description'=>'Mark ten AI mentor replies as helpful.','icon'=>'❖','completed'=>$earned['ai-scholar']],
            ['id'=>'on-fire','title'=>'On Fire','description'=>'Reach a 14-day learning streak.','icon'=>'♨','completed'=>$earned['on-fire']],
            ['id'=>'unstoppable','title'=>'Unstoppable','description'=>'Reach a 30-day learning streak.','icon'=>'☄','completed'=>$earned['unstoppable']],
            ['id'=>'rising-level','title'=>'Level 5','description'=>'Reach level 5 as a learner.','icon'=>'▲','completed'=>$earned['rising-level']],
            ['id'=>'veteran','title'=>'Veteran','description'=>'Reach the maximum learner level.','icon'=>'❖','completed'=>$earned['veteran']],
            ['id'=>'graduate','title'=>'Graduate','description'=>'Complete five courses.','icon'=>'▣','completed'=>$earned['graduate']],
            ['id'=>'marathoner','title'=>'Marathoner','description'=>'Study for fifty hours in total.','icon'=>'◷','completed'=>$earned['marathoner']],
            ['id'=>'thorough','title'=>'Thorough','description'=>'Complete twenty-five course sections.','icon'=>'▤','completed'=>$earned['thorough']],
            ['id'=>'collector','title'=>'Collector','description'=>'Save ten courses to your favourites.','icon'=>'♥','completed'=>$earned['collector']],
            ['id'=>'quiz-ace','title'=>'Quiz Ace','description'=>'Score 100% on any quiz.','icon'=>'◎','completed'=>$earned['quiz-ace']],
            ['id'=>'proven','title'=>'Proven','description'=>'Pass ten assessments.','icon'=>'◈','completed'=>$earned['proven']],
            ['id'=>'diagnostic-master','title'=>'Diagnostic Master','description'=>'Pass fifteen diagnostic scenarios.','icon'=>'⬢','completed'=>$earned['diagnostic-master']],
            ['id'=>'ambassador','title'=>'Ambassador','description'=>'Invite three friends who join HBT Learning.','icon'=>'✺','completed'=>$earned['ambassador']],
            ['id'=>'challenger','title'=>'Challenger','description'=>'Complete ten daily challenges.','icon'=>'⚔','completed'=>$earned['challenger']],
            ['id'=>'rivalry','title'=>'Rivalry','description'=>'Send five daily-challenge rivals.','icon'=>'⚑','completed'=>$earned['rivalry']],
            ['id'=>'good-samaritan','title'=>'Good Samaritan','description'=>'Send five peer bonuses to classmates.','icon'=>'☮','completed'=>$earned['good-samaritan']],
            ['id'=>'curator','title'=>'Curator','description'=>'Take notes on ten lessons.','icon'=>'✎','completed'=>$earned['curator']],
            ['id'=>'credentialed','title'=>'Credentialed','description'=>'Earn five certificates.','icon'=>'▤','completed'=>$earned['credentialed']],
            ['id'=>'badge-hoarder','title'=>'Badge Collector','description'=>'Own fifteen badges.','icon'=>'❖','completed'=>$earned['badge-hoarder']],
            ['id'=>'rising-star','title'=>'Rising Star','description'=>'Earn three badges to unlock this badge.','icon'=>'✹','completed'=>$earned['rising-star']],
        ])->map(fn (array $badge) => $badge + ['progress' => $progressMap[$badge['id']] ?? 0, 'target' => $targets[$badge['id']] ?? 1])->all();
    }
}
