<?php

namespace Tests\Feature\Auth;

use App\Domains\Progression\Models\StudentXpTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferralTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesSeeder::class);
    }

    private function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Nadia',
            'last_name' => 'Faris',
            'email' => 'nadia.faris@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ], $overrides);
    }

    public function test_register_with_valid_ref_attributes_inviter_and_awards_25_xp(): void
    {
        $inviter = User::factory()->create();
        $inviter->forceFill(['referral_code' => 'NB7Q2K9X'])->save();

        $response = $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'ref' => 'nb7q2k9x',
        ]));

        $response->assertCreated();

        $newUser = User::where('email', 'nadia.faris@example.com')->firstOrFail();

        $this->assertSame($inviter->id, $newUser->referred_by);

        $transaction = StudentXpTransaction::query()
            ->where('user_id', $inviter->id)
            ->where('event', 'referral_signup')
            ->first();

        $this->assertNotNull($transaction);
        $this->assertSame(25, (int) $transaction->xp);
        $this->assertSame(
            "referral:{$inviter->id}:{$newUser->id}",
            $transaction->dedupe_key
        );
    }

    public function test_register_without_ref_does_not_attribute_or_award(): void
    {
        $inviter = User::factory()->create();
        $inviter->forceFill(['referral_code' => 'NB7Q2K9X'])->save();

        $this->postJson('/api/v1/auth/register', $this->registerPayload())
            ->assertCreated();

        $newUser = User::where('email', 'nadia.faris@example.com')->firstOrFail();

        $this->assertNull($newUser->referred_by);

        $this->assertSame(
            0,
            StudentXpTransaction::query()->where('event', 'referral_signup')->count()
        );
    }

    public function test_register_with_unknown_ref_is_ignored(): void
    {
        User::factory()->create([
            'email' => 'real.inviter@example.com',
            'referral_code' => 'NB7Q2K9X',
        ]);

        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'ref' => 'NOPE1234',
        ]))->assertCreated();

        $newUser = User::where('email', 'nadia.faris@example.com')->firstOrFail();

        $this->assertNull($newUser->referred_by);
        $this->assertSame(
            0,
            StudentXpTransaction::query()->where('event', 'referral_signup')->count()
        );
    }

    public function test_two_referral_signups_stack_earned_xp(): void
    {
        $inviter = User::factory()->create();
        $inviter->forceFill(['referral_code' => 'NB7Q2K9X'])->save();

        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'ref' => 'NB7Q2K9X',
            'email' => 'friend.one@example.com',
        ]))->assertCreated();

        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'ref' => 'NB7Q2K9X',
            'email' => 'friend.two@example.com',
        ]))->assertCreated();

        $this->assertSame(
            50,
            (int) StudentXpTransaction::query()
                ->where('user_id', $inviter->id)
                ->where('event', 'referral_signup')
                ->sum('xp')
        );
    }

    public function test_referrals_endpoint_mints_code_once_and_reports_stats(): void
    {
        $inviter = User::factory()->create();

        $first = $this->actingAs($inviter)
            ->postJson('/api/v1/referrals');

        $first->assertOk()->assertJsonPath('data.code', fn ($code) => is_string($code) && strlen($code) === 8);

        $code = $first->json('data.code');

        $this->assertSame(
            $code,
            $inviter->fresh()->referral_code
        );

        $second = $this->actingAs($inviter)->postJson('/api/v1/referrals');

        $second
            ->assertOk()
            ->assertJsonPath('data.code', $code)
            ->assertJsonPath('data.invites', 0)
            ->assertJsonPath('data.xp_earned', 0)
            ->assertJsonPath('data.reward_xp', 25);
    }

    public function test_referrals_endpoint_reports_invites_and_earned_xp(): void
    {
        $inviter = User::factory()->create();
        $inviter->forceFill(['referral_code' => 'NB7Q2K9X'])->save();

        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'ref' => 'NB7Q2K9X',
            'email' => 'friend.one@example.com',
        ]))->assertCreated();

        $this->actingAs($inviter)
            ->postJson('/api/v1/referrals')
            ->assertOk()
            ->assertJsonPath('data.code', 'NB7Q2K9X')
            ->assertJsonPath('data.invites', 1)
            ->assertJsonPath('data.xp_earned', 25);
    }

    public function test_referrals_endpoint_requires_auth(): void
    {
        $this->postJson('/api/v1/referrals')->assertUnauthorized();
    }
}
