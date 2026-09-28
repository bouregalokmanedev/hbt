<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function signedUrl(User $user): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(60),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );
    }

    public function test_browser_click_verifies_and_redirects_into_the_app(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'student@example.com',
            'status' => 'pending',
        ]);

        $response = $this->get($this->signedUrl($user));

        $response->assertRedirect(
            rtrim(config('app.frontend_url'), '/') . '/login?verified=1'
        );

        $user->refresh();

        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('active', $user->status);
    }

    public function test_unsigned_link_redirects_to_the_error_flag(): void
    {
        $user = User::factory()->unverified()->create();

        $url = route('verification.verify', [
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        $this->get($url)->assertRedirect(
            rtrim(config('app.frontend_url'), '/') . '/login?verify=error'
        );

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_api_clients_still_receive_json(): void
    {
        $user = User::factory()->unverified()->create();

        $this->getJson($this->signedUrl($user))
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Email verified successfully.',
            ]);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
