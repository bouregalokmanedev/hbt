<?php

namespace Tests\Feature\Domains\Students;

use App\Domains\Notifications\Models\StudentNotification;
use App\Models\AuthenticationLog;
use App\Models\Certificate;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StudentAccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    private function deletionPayload(): array
    {
        return [
            'reason' => 'not_using',
            'current_password' => 'password',
            'confirm_deletion' => true,
        ];
    }

    public function test_deleting_an_account_anonymises_personal_data_and_revokes_access(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Lokmane',
            'last_name' => 'Bourega',
            'username' => 'lokmane-bourega',
            'email' => 'lokmane@example.com',
            'phone' => '+213555000000',
            'avatar' => 'data:image/png;base64,abc',
            'bio' => 'Private bio',
            'country' => 'DZ',
            'referral_code' => 'REF12345',
            'visitor_id' => '11111111-1111-4111-8111-111111111111',
        ]);

        $token = $user->createToken('test-device')->plainTextToken;

        $user->sessions()->create([
            'device_name' => 'Chrome',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'last_activity_at' => now(),
            'logged_in_at' => now(),
        ]);

        DB::table('one_time_passwords')->insert([
            'id' => '22222222-2222-4222-8222-222222222222',
            'user_id' => $user->id,
            'purpose' => 'two_factor_enable',
            'code' => '123456',
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        StudentNotification::create([
            'user_id' => $user->id,
            'type' => 'system',
            'title' => 'Welcome',
            'message' => 'Hello',
        ]);

        AuthenticationLog::create([
            'user_id' => $user->id,
            'event' => 'login',
            'successful' => true,
            'email' => 'lokmane@example.com',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ]);

        DB::table('password_reset_tokens')->insert([
            'email' => 'lokmane@example.com',
            'token' => 'reset-token',
            'created_at' => now(),
        ]);

        $certificate = Certificate::factory()->create([
            'user_id' => $user->id,
            'recipient_name' => 'Lokmane Bourega',
        ]);

        $this->withToken($token)
            ->deleteJson('/api/v1/student/settings/account', $this->deletionPayload())
            ->assertOk();

        $trashed = User::withTrashed()->findOrFail($user->id);

        $this->assertNotNull($trashed->deleted_at);
        $this->assertSame('Deleted', $trashed->first_name);
        $this->assertSame('User', $trashed->last_name);
        $this->assertNotSame('lokmane@example.com', $trashed->email);
        $this->assertStringEndsWith('@deleted.invalid', $trashed->email);
        $this->assertNotSame('lokmane-bourega', $trashed->username);
        $this->assertNull($trashed->phone);
        $this->assertNull($trashed->avatar);
        $this->assertNull($trashed->bio);
        $this->assertNull($trashed->country);
        $this->assertNull($trashed->referral_code);
        $this->assertNull($trashed->visitor_id);
        $this->assertNull($trashed->email_verified_at);
        $this->assertSame('inactive', $trashed->status);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
        $this->assertDatabaseMissing('user_sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('one_time_passwords', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('student_notifications', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('authentication_logs', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'lokmane@example.com']);

        $this->assertDatabaseHas('student_account_deletions', [
            'user_id' => $user->id,
            'reason' => 'not_using',
        ]);

        $this->assertSame(
            'Deleted User',
            $certificate->fresh()->recipient_name,
        );

        // The deletion audit is retained, but it must not carry the email.
        $audit = DB::table('audit_logs')
            ->where('event', 'security.account.deleted')
            ->first();

        $this->assertNotNull($audit);
        $this->assertStringNotContainsString(
            'lokmane@example.com',
            (string) $audit->new_values,
        );

        // The revoked bearer token can no longer be used. Forget the guard
        // cached during the delete request so this behaves like a real second
        // HTTP request in a fresh worker.
        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_a_deleted_account_frees_the_email_for_re_registration(): void
    {
        $user = User::factory()->create([
            'email' => 'returning@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $this->actingAs($user)
            ->deleteJson('/api/v1/student/settings/account', [
                'reason' => 'not_using',
                'current_password' => 'Password123!',
                'confirm_deletion' => true,
            ])
            ->assertOk();

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Returning',
            'last_name' => 'Learner',
            'email' => 'returning@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'returning@example.com',
            'deleted_at' => null,
        ]);

        // The anonymised old row is kept for financial/progress history.
        $this->assertSame(
            1,
            User::withTrashed()
                ->where('email', 'like', 'deleted-%@deleted.invalid')
                ->count(),
        );
    }
}
