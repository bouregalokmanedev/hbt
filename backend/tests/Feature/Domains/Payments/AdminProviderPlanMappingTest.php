<?php

use App\Domains\Payments\Models\PaymentProviderPlan;
use App\Domains\Payments\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
});

function providerMappingAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

function providerMappingPlan(): Plan
{
    return Plan::create([
        'name' => 'Professional',
        'slug' => 'professional',
        'price' => 2500,
        'currency' => 'USD',
        'interval' => 'month',
        'active' => true,
    ]);
}

it('lists provider mappings for a plan', function () {
    $admin = providerMappingAdmin();
    $plan = providerMappingPlan();

    PaymentProviderPlan::create([
        'subscription_plan_id' => $plan->id,
        'provider' => 'stripe',
        'external_price_id' => 'price_123',
    ]);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/plans/{$plan->id}/provider-mappings")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.provider', 'stripe')
        ->assertJsonPath('data.0.external_price_id', 'price_123');
});

it('creates and updates a stripe price mapping', function () {
    $admin = providerMappingAdmin();
    $plan = providerMappingPlan();

    $this->actingAs($admin)
        ->putJson("/api/v1/admin/plans/{$plan->id}/provider-mappings", [
            'provider' => 'stripe',
            'external_product_id' => 'prod_123',
            'external_price_id' => 'price_123',
            'currency' => 'USD',
            'amount' => 2500,
            'status' => 'active',
        ])
        ->assertOk()
        ->assertJsonPath('data.external_price_id', 'price_123');

    $this->actingAs($admin)
        ->putJson("/api/v1/admin/plans/{$plan->id}/provider-mappings", [
            'provider' => 'stripe',
            'external_price_id' => 'price_456',
        ])
        ->assertOk()
        ->assertJsonPath('data.external_price_id', 'price_456');

    expect(PaymentProviderPlan::where('subscription_plan_id', $plan->id)->count())->toBe(1);
    $this->assertDatabaseHas('payment_provider_plans', [
        'subscription_plan_id' => $plan->id,
        'provider' => 'stripe',
        'external_price_id' => 'price_456',
    ]);
});

it('rejects unsupported providers and non-admin access', function () {
    $plan = providerMappingPlan();

    $this->actingAs(providerMappingAdmin())
        ->putJson("/api/v1/admin/plans/{$plan->id}/provider-mappings", [
            'provider' => 'manual',
        ])
        ->assertUnprocessable();

    $this->actingAs(User::factory()->create())
        ->getJson("/api/v1/admin/plans/{$plan->id}/provider-mappings")
        ->assertForbidden();
});
