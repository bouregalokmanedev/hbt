<?php

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\Achievements\Services\AchievementService;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Challenges\Models\DailyChallengeAssignment;
use App\Domains\Challenges\Models\DailyChallengeDef;
use App\Domains\Challenges\Models\DailyChallengeRival;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Favorite;
use App\Models\Lesson;
use App\Models\LessonNote;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function badgesFor(User $user): array
{
    return collect(app(AchievementService::class)->sync($user))->keyBy('id')->all();
}

function badgeUnlocked(array $badges, string $id): bool
{
    return (bool) ($badges[$id]['completed'] ?? false);
}

it('exposes a 41 badge catalogue with unique ids', function () {
    $badges = app(AchievementService::class)->sync(User::factory()->create());
    $ids = array_column($badges, 'id');

    expect($ids)->toHaveCount(41)
        ->and(array_unique($ids))->toHaveCount(41)
        ->and($ids)->toContain(
            'on-fire', 'unstoppable', 'rising-level', 'veteran',
            'graduate', 'marathoner', 'thorough', 'collector',
            'quiz-ace', 'proven', 'diagnostic-master',
            'ambassador', 'challenger', 'rivalry', 'good-samaritan',
            'curator', 'credentialed', 'badge-hoarder',
        );
});

it('unlocks the streak and level badges from the progression profile', function () {
    $user = User::factory()->create();

    StudentProgressionProfile::create([
        'user_id' => $user->id,
        'level' => 5,
        'longest_streak' => 14,
    ]);

    $badges = badgesFor($user);

    expect(badgeUnlocked($badges, 'on-fire'))->toBeTrue()
        ->and(badgeUnlocked($badges, 'rising-level'))->toBeTrue()
        ->and(badgeUnlocked($badges, 'unstoppable'))->toBeFalse()
        ->and(badgeUnlocked($badges, 'veteran'))->toBeFalse()
        ->and($badges['on-fire']['target'])->toBe(14)
        ->and($badges['rising-level']['progress'])->toBe(5);

    StudentProgressionProfile::where('user_id', $user->id)->update([
        'level' => 7,
        'longest_streak' => 30,
    ]);

    $badges = badgesFor($user);

    expect(badgeUnlocked($badges, 'unstoppable'))->toBeTrue()
        ->and(badgeUnlocked($badges, 'veteran'))->toBeTrue()
        ->and($badges['veteran']['target'])->toBe(7);
});

it('unlocks graduate after five completed courses', function () {
    $user = User::factory()->create();

    Enrollment::factory()->count(4)->completed()->create(['user_id' => $user->id]);
    expect(badgeUnlocked(badgesFor($user), 'graduate'))->toBeFalse();

    Enrollment::factory()->completed()->create(['user_id' => $user->id]);

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'graduate'))->toBeTrue()
        ->and($badges['graduate']['progress'])->toBe(5);
});

it('unlocks marathoner after fifty hours of study time', function () {
    $user = User::factory()->create();

    CourseProgress::create([
        'user_id' => $user->id,
        'course_id' => Course::factory()->create()->id,
        'progress_percentage' => 0,
        'time_spent' => 49 * 3600,
    ]);
    expect(badgeUnlocked(badgesFor($user), 'marathoner'))->toBeFalse();

    CourseProgress::where('user_id', $user->id)->update(['time_spent' => 50 * 3600]);

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'marathoner'))->toBeTrue()
        ->and($badges['marathoner']['target'])->toBe(50);
});

it('unlocks thorough after twenty-five completed sections', function () {
    $user = User::factory()->create();

    SectionProgress::factory()->count(25)->create([
        'user_id' => $user->id,
        'completed_at' => now(),
    ]);

    expect(badgeUnlocked(badgesFor($user), 'thorough'))->toBeTrue();
});

it('unlocks collector after ten favourited courses', function () {
    $user = User::factory()->create();

    foreach (range(1, 10) as $ignored) {
        Favorite::create([
            'user_id' => $user->id,
            'favoritable_type' => Favorite::TYPE_COURSE,
            'favoritable_id' => (string) Str::uuid(),
        ]);
    }

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'collector'))->toBeTrue()
        ->and($badges['collector']['target'])->toBe(10);
});

it('unlocks quiz-ace only on a perfect quiz score', function () {
    $user = User::factory()->create();

    QuizAttempt::factory()->create(['user_id' => $user->id, 'percentage' => 99]);
    expect(badgeUnlocked(badgesFor($user), 'quiz-ace'))->toBeFalse();

    QuizAttempt::factory()->create(['user_id' => $user->id, 'percentage' => 100]);

    expect(badgeUnlocked(badgesFor($user), 'quiz-ace'))->toBeTrue();
});

it('unlocks proven after ten passed assessments', function () {
    $user = User::factory()->create();

    AssessmentAttempt::factory()->count(9)->create(['user_id' => $user->id, 'passed' => true]);
    expect(badgeUnlocked(badgesFor($user), 'proven'))->toBeFalse();

    AssessmentAttempt::factory()->create(['user_id' => $user->id, 'passed' => true]);

    expect(badgeUnlocked(badgesFor($user), 'proven'))->toBeTrue();
});

it('unlocks diagnostic-master after fifteen passed scenarios', function () {
    $user = User::factory()->create();

    DiagnosticScenarioAttempt::factory()->count(15)->create([
        'user_id' => $user->id,
        'passed' => true,
    ]);

    expect(badgeUnlocked(badgesFor($user), 'diagnostic-master'))->toBeTrue();
});

it('unlocks ambassador after three referred signups', function () {
    $user = User::factory()->create();

    User::factory()->count(3)->create(['referred_by' => $user->id]);

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'ambassador'))->toBeTrue()
        ->and($badges['ambassador']['target'])->toBe(3);
});

it('unlocks challenger after ten completed daily challenges', function () {
    $user = User::factory()->create();
    $def = DailyChallengeDef::create([
        'key' => 'lesson-complete-'.Str::random(6),
        'title' => 'Finish a lesson',
        'action' => 'lesson_complete',
        'target' => 1,
    ]);

    foreach (range(1, 10) as $i) {
        DailyChallengeAssignment::create([
            'user_id' => $user->id,
            'daily_challenge_def_id' => $def->id,
            'date' => now()->subDays($i)->toDateString(),
            'status' => 'claimed',
            'target' => 1,
            'progress' => 1,
            'completed_at' => now(),
        ]);
    }

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'challenger'))->toBeTrue()
        ->and($badges['challenger']['progress'])->toBe(10);
});

it('unlocks rivalry after five sent rivals', function () {
    $user = User::factory()->create();
    $others = User::factory()->count(5)->create();

    foreach ($others as $i => $other) {
        DailyChallengeRival::create([
            'challenger_id' => $user->id,
            'challenged_id' => $other->id,
            'date' => now()->subDays($i)->toDateString(),
            'status' => 'pending',
        ]);
    }

    expect(badgeUnlocked(badgesFor($user), 'rivalry'))->toBeTrue();
});

it('unlocks good-samaritan after five peer bonuses', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $i) {
        StudentXpTransaction::create([
            'user_id' => $user->id,
            'event' => 'peer_bonus',
            'xp' => 5,
            'dedupe_key' => "peer-bonus:{$user->id}:2026-01-{$i}",
        ]);
    }

    expect(badgeUnlocked(badgesFor($user), 'good-samaritan'))->toBeTrue();
});

it('unlocks curator after notes on ten lessons', function () {
    $user = User::factory()->create();

    Lesson::factory()->count(10)->create()->each(
        fn (Lesson $lesson) => LessonNote::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'title' => 'Note',
            'content' => 'content',
        ])
    );

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'curator'))->toBeTrue()
        ->and($badges['curator']['progress'])->toBe(10);
});

it('unlocks credentialed after five certificates', function () {
    $user = User::factory()->create();

    Certificate::factory()->count(5)->create(['user_id' => $user->id]);

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'credentialed'))->toBeTrue()
        ->and($badges['credentialed']['progress'])->toBe(5);
});

it('settles badge-hoarder only once fifteen badges actually exist', function () {
    $user = User::factory()->create();

    $badges = badgesFor($user);
    $owned = collect($badges)->filter(fn (array $badge) => (bool) $badge['completed'])->count();

    expect($owned)->toBeLessThan(15)
        ->and(badgeUnlocked($badges, 'badge-hoarder'))->toBeFalse();

    foreach (range(1, 15 - $owned) as $i) {
        UserAchievement::create([
            'user_id' => $user->id,
            'badge' => 'filler-'.$i,
            'earned_at' => now(),
        ]);
    }

    $badges = badgesFor($user);
    expect(badgeUnlocked($badges, 'badge-hoarder'))->toBeTrue()
        ->and($badges['badge-hoarder']['progress'])->toBe(15);
});
