<?php

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

it('caps free learners at five simulator sessions per month', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $i) {
        simLimitStart($user)->assertCreated();
    }

    simLimitStart($user)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['sessions']);

    expect(SimulatorSession::where('user_id', $user->id)->count())->toBe(5);
});

it('reports monthly usage for the free tier', function () {
    $user = User::factory()->create();

    simLimitStart($user)->assertCreated();
    simLimitStart($user)->assertCreated();

    $this->actingAs($user)
        ->getJson('/api/v1/simulator/usage')
        ->assertOk()
        ->assertJsonPath('data.used', 2)
        ->assertJsonPath('data.limit', 5)
        ->assertJsonPath('data.remaining', 3)
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
