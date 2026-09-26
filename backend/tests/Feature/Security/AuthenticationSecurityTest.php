<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_brute_force_creates_risk_signal(): void
    {
        $user = User::factory()->create(['email' => 'victim@example.com', 'password' => bcrypt('correct')]);

        foreach (range(1, 6) as $i) {
            $this->postJson('/api/v1/auth/login', ['email' => 'victim@example.com', 'password' => 'wrong']);
        }

        $this->assertDatabaseHas('risk_signals', ['type' => 'brute_force']);
        $this->assertDatabaseHas('security_events', ['event_type' => 'SUSPICIOUS_LOGIN']);
    }

    public function test_tenant_isolation_blocks_cross_tenant_course_access(): void
    {
        \Spatie\Permission\Models\Role::findOrCreate('Instructor', 'web');

        $tenantA = '11111111-1111-1111-1111-111111111111';
        $tenantB = '22222222-2222-2222-2222-222222222222';

        $instructorA = User::factory()->create(['tenant_id' => $tenantA]);
        $instructorA->assignRole('Instructor');
        $course = \App\Models\Course::factory()->create(['instructor_id' => $instructorA->id, 'tenant_id' => $tenantA]);

        $instructorB = User::factory()->create(['tenant_id' => $tenantB]);
        $instructorB->assignRole('Instructor');

        $this->actingAs($instructorB);

        $this->assertFalse($instructorB->can('update', $course));
    }
}
