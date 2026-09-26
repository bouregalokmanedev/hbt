<?php

use App\Domains\Analytics\Models\AnalyticsEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('accepts funnel events from logged-out visitors', function () {
    $this->postJson('/api/v1/analytics/events', [
        'event' => 'pricing_viewed',
        'page' => '/pricing',
        'properties' => ['source' => 'landing'],
    ])->assertStatus(202);

    expect(AnalyticsEvent::count())->toBe(1);

    $event = AnalyticsEvent::firstOrFail();
    expect($event->user_id)->toBeNull();
    expect($event->event)->toBe('pricing_viewed');
    expect($event->properties['source'])->toBe('landing');
});

it('attributes funnel events to the signed-in learner', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/analytics/events', [
        'event' => 'simulator_limit_reached',
        'page' => '/simulator',
    ])->assertStatus(202);

    expect(AnalyticsEvent::firstOrFail()->user_id)->toBe($user->id);
});

it('rejects events outside the funnel whitelist', function () {
    $this->postJson('/api/v1/analytics/events', [
        'event' => 'someone_elses_event',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['event']);

    expect(AnalyticsEvent::count())->toBe(0);
});

it('accepts the referral invite share event', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/analytics/events', [
        'event' => 'referral_invite_shared',
        'page' => '/dashboard',
        'properties' => ['source' => 'dashboard_copy'],
    ])->assertStatus(202);

    $event = AnalyticsEvent::firstOrFail();
    expect($event->event)->toBe('referral_invite_shared');
    expect($event->properties['source'])->toBe('dashboard_copy');
});
