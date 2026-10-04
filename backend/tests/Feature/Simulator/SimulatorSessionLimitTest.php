<?php

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Models\Plan;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Models\SubscriptionFeature;
use App\Domains\Simulator\Models\SimulatorSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function simLimitStart(User $user): \Illuminate\Testing\TestResponse
{
    return test()->actingAs($user)->postJson('/api/v1/simulator/sessions', [
        'vehicle_key' => 'corolla-1zr-fe',
        'tool' => 'scanner',
    ]);
}

function simLimitProSubscription(User $user, ?string $featureValue): Subscription
{
    $plan = Plan::create([
        'name' => 'Professional',
        'slug' => 'professional-'.Str::random(6),
        'price' => 2900,
        'currency' => 'DZD',
        'interval' => 'month',
        'active' => true,
    ]);

    if ($featureValue !== null) {
        $feature = SubscriptionFeature::updateOrCreate(
            ['key' => 'max_simulator_sessions_monthly'],
            ['name' => 'Monthly simulator sessions', 'type' => 'integer'],
        );

        DB::table('subscription_plan_features')->insert([
            'id' => (string) Str::uuid(),
            'subscription_plan_id' => $plan->id,
            'subscription_feature_id' => $feature->id,
            'value' => $featureValue,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    return Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'provider' => 'manual',
        'status' => SubscriptionStatus::ACTIVE,
        'current_period_ends_at' => now()->addMonth(),
    ]);
}

it('caps free learners at ten simulator sessions per month', function () {
    $user = User::factory()->create();

    foreach (range(1, 10) as $i) {
        simLimitStart($user)->assertCreated();
    }

    simLimitStart($user)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['sessions']);

    expect(SimulatorSession::where('user_id', $user->id)->count())->toBe(10);
});

it('reports monthly usage for the free tier', function () {
    $user = User::factory()->create();

    simLimitStart($user)->assertCreated();
    simLimitStart($user)->assertCreated();

    $this->actingAs($user)
        ->getJson('/api/v1/simulator/usage')
        ->assertOk()
        ->assertJsonPath('data.used', 2)
        ->assertJsonPath('data.limit', 10)
        ->assertJsonPath('data.remaining', 8)
        ->assertJsonPath('data.bonus', 0)
        ->assertJsonPath('data.unlimited', false);
});

it('keeps paid learners unlimited when the plan does not cap sessions', function () {
    $user = User::factory()->create();
    simLimitProSubscription($user, null);

    foreach (range(1, 7) as $i) {
        simLimitStart($user)->assertCreated();
    }

    $this->actingAs($user)
        ->getJson('/api/v1/simulator/usage')
        ->assertOk()
        ->assertJsonPath('data.limit', null)
        ->assertJsonPath('data.remaining', null)
        ->assertJsonPath('data.unlimited', true);
});

it('honours an explicit plan cap', function () {
    $user = User::factory()->create();
    simLimitProSubscription($user, '2');

    simLimitStart($user)->assertCreated();
    simLimitStart($user)->assertCreated();
    simLimitStart($user)->assertStatus(422)->assertJsonValidationErrors(['sessions']);

    $this->actingAs($user)
        ->getJson('/api/v1/simulator/usage')
        ->assertOk()
        ->assertJsonPath('data.limit', 2)
        ->assertJsonPath('data.remaining', 0);
});

it('treats an unlimited feature value as no cap', function () {
    $user = User::factory()->create();
    simLimitProSubscription($user, 'unlimited');

    foreach (range(1, 6) as $i) {
        simLimitStart($user)->assertCreated();
    }
});

it('adds one extra simulator session per unlocked simulator badge', function (array $badges, int $expectedLimit) {
    $user = User::factory()->create();

    foreach ($badges as $badge) {
        UserAchievement::create(['user_id' => $user->id, 'badge' => $badge, 'earned_at' => now()]);
    }

    $this->actingAs($user)
        ->getJson('/api/v1/simulator/usage')
        ->assertOk()
        ->assertJsonPath('data.limit', $expectedLimit)
        ->assertJsonPath('data.base_limit', 10)
        ->assertJsonPath('data.bonus', $expectedLimit - 10)
        ->assertJsonPath('data.unlimited', false);
})->with([
    'no badge' => [[], 10],
    'one badge' => [['bench-starter'], 11],
    'two badges' => [['bench-starter', 'sim-explorer'], 12],
    'three badges' => [['bench-starter', 'sim-explorer', 'bench-ace'], 13],
]);

it('ignores non simulator badges when boosting the session quota', function () {
    $user = User::factory()->create();

    UserAchievement::create(['user_id' => $user->id, 'badge' => 'scholar', 'earned_at' => now()]);
    UserAchievement::create(['user_id' => $user->id, 'badge' => 'rising-star', 'earned_at' => now()]);

    $this->actingAs($user)
        ->getJson('/api/v1/simulator/usage')
        ->assertOk()
        ->assertJsonPath('data.limit', 10)
        ->assertJsonPath('data.bonus', 0);
});

it('lets a badge boosted learner start sessions beyond the base ten', function () {
    $user = User::factory()->create();

    foreach (['bench-starter', 'sim-explorer', 'bench-ace'] as $badge) {
        UserAchievement::create(['user_id' => $user->id, 'badge' => $badge, 'earned_at' => now()]);
    }

    foreach (range(1, 13) as $i) {
        simLimitStart($user)->assertCreated();
    }

    simLimitStart($user)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['sessions']);

    expect(SimulatorSession::where('user_id', $user->id)->count())->toBe(13);
});
