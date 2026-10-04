<?php

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\Achievements\Services\AchievementService;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function mentorConversationFor(User $user): MentorConversation
{
    return MentorConversation::factory()->create(['user_id' => $user->id]);
}

function mentorMessageFor(MentorConversation $conversation, MentorMessageRole $role = MentorMessageRole::USER): MentorMessage
{
    return MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => $role,
    ]);
}

function badgeIds(User $user): array
{
    return UserAchievement::where('user_id', $user->id)
        ->pluck('badge')
        ->sort()
        ->values()
        ->all();
}

it('does not award the ai mentor badges before any chat activity', function () {
    $user = User::factory()->create();

    $badges = app(AchievementService::class)->sync($user);

    foreach (['ai-first-chat', 'ai-conversationalist', 'ai-confidant', 'ai-scholar'] as $id) {
        $badge = collect($badges)->firstWhere('id', $id);

        expect($badge)->not->toBeNull()
            ->and($badge['completed'])->toBeFalse()
            ->and($badge['progress'])->toBe(0);
    }
});

it('awards ai-first-chat on the first student message', function () {
    $user = User::factory()->create();
    $conversation = mentorConversationFor($user);
    mentorMessageFor($conversation);

    $badges = app(AchievementService::class)->sync($user);
    $badge = collect($badges)->firstWhere('id', 'ai-first-chat');

    expect($badge['completed'])->toBeTrue()
        ->and($badge['progress'])->toBe(1)
        ->and($badge['target'])->toBe(1)
        ->and(badgeIds($user))->toContain('ai-first-chat');
});

it('only counts student messages, not mentor replies', function () {
    $user = User::factory()->create();
    $conversation = mentorConversationFor($user);

    foreach (range(1, 5) as $i) {
        mentorMessageFor($conversation, MentorMessageRole::ASSISTANT);
    }

    $badges = app(AchievementService::class)->sync($user);

    expect(collect($badges)->firstWhere('id', 'ai-first-chat')['completed'])->toBeFalse()
        ->and(collect($badges)->firstWhere('id', 'ai-confidant')['progress'])->toBe(1);
});

it('does not count messages that belong to another student', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $otherConversation = mentorConversationFor($other);
    mentorMessageFor($otherConversation);

    $badges = app(AchievementService::class)->sync($user);

    expect(collect($badges)->firstWhere('id', 'ai-first-chat')['completed'])->toBeFalse();
});

it('unlocks ai-conversationalist at fifty student messages', function () {
    $user = User::factory()->create();
    $conversation = mentorConversationFor($user);

    foreach (range(1, 49) as $i) {
        mentorMessageFor($conversation);
    }

    $badges = app(AchievementService::class)->sync($user);
    $badge = collect($badges)->firstWhere('id', 'ai-conversationalist');

    expect($badge['completed'])->toBeFalse()
        ->and($badge['progress'])->toBe(49)
        ->and($badge['target'])->toBe(50);

    mentorMessageFor($conversation);
    $badges = app(AchievementService::class)->sync($user);

    expect(collect($badges)->firstWhere('id', 'ai-conversationalist')['completed'])->toBeTrue()
        ->and(badgeIds($user))->toContain('ai-conversationalist');
});

it('unlocks ai-confidant after five separate conversations', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $i) {
        mentorConversationFor($user);
    }

    $badges = app(AchievementService::class)->sync($user);
    $badge = collect($badges)->firstWhere('id', 'ai-confidant');

    expect($badge['completed'])->toBeTrue()
        ->and($badge['progress'])->toBe(5)
        ->and($badge['target'])->toBe(5);
});

it('unlocks ai-scholar after ten helpful ratings', function () {
    $user = User::factory()->create();
    $conversation = mentorConversationFor($user);

    foreach (range(1, 10) as $i) {
        $message = mentorMessageFor($conversation, MentorMessageRole::ASSISTANT);

        MentorMessageFeedback::factory()->positive()->create([
            'user_id' => $user->id,
            'mentor_message_id' => $message->id,
        ]);
    }

    $badges = app(AchievementService::class)->sync($user);
    $badge = collect($badges)->firstWhere('id', 'ai-scholar');

    expect($badge['completed'])->toBeTrue()
        ->and($badge['progress'])->toBe(10)
        ->and($badge['target'])->toBe(10);
});

it('ignores negative ratings when counting towards ai-scholar', function () {
    $user = User::factory()->create();
    $conversation = mentorConversationFor($user);

    foreach (range(1, 10) as $i) {
        $message = mentorMessageFor($conversation, MentorMessageRole::ASSISTANT);

        MentorMessageFeedback::factory()->negative()->create([
            'user_id' => $user->id,
            'mentor_message_id' => $message->id,
        ]);
    }

    $badges = app(AchievementService::class)->sync($user);

    expect(collect($badges)->firstWhere('id', 'ai-scholar')['completed'])->toBeFalse()
        ->and(collect($badges)->firstWhere('id', 'ai-scholar')['progress'])->toBe(0);
});

it('grants one extra simulator session per unlocked simulator badge', function (array $badges, int $expected) {
    $user = User::factory()->create();

    foreach ($badges as $badge) {
        UserAchievement::create(['user_id' => $user->id, 'badge' => $badge, 'earned_at' => now()]);
    }

    expect(app(AchievementService::class)->simulatorSessionBonus($user))->toBe($expected);
})->with([
    'none' => [[], 0],
    'one' => [['bench-starter'], 1],
    'two' => [['bench-starter', 'sim-explorer'], 2],
    'all three' => [['bench-starter', 'sim-explorer', 'bench-ace'], 3],
    'unrelated badges ignored' => [['scholar', 'mentor', 'rising-star'], 0],
]);
