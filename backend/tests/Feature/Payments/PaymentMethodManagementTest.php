<?php

use App\Domains\Payments\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function pmFor(User $user, array $attributes = []): PaymentMethod
{
    return PaymentMethod::create(array_merge([
        'user_id' => $user->id,
        'provider' => 'stripe',
        'provider_payment_method_id' => 'pm_test_'.Str::uuid(),
        'type' => 'card',
        'brand' => 'visa',
        'last_four' => '4242',
        'is_default' => false,
    ], $attributes));
}

it('requires authentication to manage payment methods', function () {
    $method = pmFor(User::factory()->create(), ['is_default' => true]);

    $this->deleteJson('/api/v1/payment-methods/'.$method->id)->assertStatus(401);
    $this->patchJson('/api/v1/payment-methods/'.$method->id.'/default')->assertStatus(401);
});

it('lets the owner make a card the default', function () {
    $user = User::factory()->create();
    $first = pmFor($user, ['is_default' => true]);
    $second = pmFor($user, ['brand' => 'mastercard', 'last_four' => '5555']);

    $this->actingAs($user)
        ->patchJson('/api/v1/payment-methods/'.$second->id.'/default')
        ->assertOk()
        ->assertJsonPath('data.is_default', true);

    expect($second->fresh()->is_default)->toBeTrue()
        ->and($first->fresh()->is_default)->toBeFalse();
});

it('lets the owner remove a saved card', function () {
    $user = User::factory()->create();
    $method = pmFor($user, ['brand' => 'amex', 'last_four' => '1005']);

    $this->actingAs($user)
        ->deleteJson('/api/v1/payment-methods/'.$method->id)
        ->assertOk();

    $this->actingAs($user)->getJson('/api/v1/payment-methods')->assertOk()->assertJsonCount(0, 'data');
    expect(PaymentMethod::find($method->id))->toBeNull();
});

it('keeps another default when a non-default card is removed', function () {
    $user = User::factory()->create();
    $default = pmFor($user, ['is_default' => true]);
    $extra = pmFor($user, ['brand' => 'mastercard', 'last_four' => '5555']);

    $this->actingAs($user)->deleteJson('/api/v1/payment-methods/'.$extra->id)->assertOk();

    expect($default->fresh()->is_default)->toBeTrue();
});

it('blocks managing another users payment methods', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $method = pmFor($owner, ['is_default' => true]);

    $this->actingAs($intruder)
        ->deleteJson('/api/v1/payment-methods/'.$method->id)
        ->assertForbidden();

    $this->actingAs($intruder)
        ->patchJson('/api/v1/payment-methods/'.$method->id.'/default')
        ->assertForbidden();

    expect(PaymentMethod::find($method->id))->not->toBeNull();
});

it('supports tamara as a saved buy-now-pay-later method', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/payment-methods', [
            'provider' => 'tamara',
            'type' => 'tamara',
            'brand' => 'tamara',
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', 'tamara')
        ->assertJsonPath('data.provider', 'tamara')
        ->assertJsonPath('data.brand', 'tamara')
        ->assertJsonPath('data.last_four', null);

    $listed = $this->actingAs($user)->getJson('/api/v1/payment-methods');

    $listed->assertOk()->assertJsonCount(1, 'data');
    expect($listed->json('data.0.type'))->toBe('tamara');
});

it('promotes a remaining card to default when the default is removed', function () {
    $user = User::factory()->create();
    $default = pmFor($user, ['is_default' => true]);
    $other = pmFor($user, ['brand' => 'mastercard', 'last_four' => '5555']);

    $this->actingAs($user)->deleteJson('/api/v1/payment-methods/'.$default->id)->assertOk();

    expect($other->fresh()->is_default)->toBeTrue();
});
