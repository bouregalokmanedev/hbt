<?php

use App\Domains\Simulator\Models\SimulatorResult;
use App\Domains\Simulator\Models\SimulatorSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Models\VehicleMake;
use App\Models\VehicleModel;
use App\Models\VehicleVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Super Admin', 'Instructor', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function simActInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function simActStudent(): User
{
    $user = User::factory()->create();
    $user->assignRole('Student');

    return $user;
}

function simActAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('Admin');

    return $user;
}

function simActEnroll(User $instructor, User $student): Course
{
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    Enrollment::factory()->create(['course_id' => $course->id, 'user_id' => $student->id]);

    return $course;
}

function simActCompletedSession(User $student, array $overrides = []): SimulatorSession
{
    $session = SimulatorSession::create(array_merge([
        'user_id' => $student->id,
        'vehicle_key' => 'corolla-1zr-fe',
        'tool' => 'scanner',
        'scenario_key' => 'fuel-starvation',
        'status' => 'completed',
        'started_at' => now()->subMinutes(10),
        'ended_at' => now(),
        'duration_seconds' => 300,
        'score' => 82,
    ], $overrides));

    SimulatorResult::create([
        'session_id' => $session->id,
        'user_id' => $student->id,
        'tool' => $session->tool,
        'scenario_key' => $session->scenario_key,
        'score' => $session->score,
        'outcome' => 'pass',
        'verdict' => 'content:scanner.training.verdict.correct',
        'attempts' => 3,
        'hints_used' => 1,
        'duration_seconds' => 300,
        'steps' => [['label' => 'codes', 'ok' => true]],
        'metadata' => ['source' => 'test'],
    ]);

    return $session->fresh();
}

describe('Instructor simulator activity', function () {
    it('returns analytics scoped to students enrolled in owned courses', function () {
        $instructor = simActInstructor();
        $other = simActInstructor();
        $student = simActStudent();
        $outsider = simActStudent();
        simActEnroll($instructor, $student);
        simActEnroll($other, $outsider);

        simActCompletedSession($student);
        simActCompletedSession($outsider, ['tool' => 'multimeter', 'score' => 40]);

        $this->actingAs($instructor)
            ->getJson('/api/v1/instructor/simulator/analytics')
            ->assertOk()
            ->assertJsonPath('data.totals.sessions', 1)
            ->assertJsonPath('data.totals.results', 1)
            ->assertJsonPath('data.totals.students', 1)
            ->assertJsonPath('data.totals.average_score', 82)
            ->assertJsonPath('data.totals.pass_rate', 100)
            ->assertJsonPath('data.totals.average_hints', 1)
            ->assertJsonPath('data.by_tool.0.tool', 'scanner')
            ->assertJsonPath('data.by_tool.0.sessions', 1);
    });

    it('lists sessions with filters and hides other instructors students', function () {
        $instructor = simActInstructor();
        $other = simActInstructor();
        $student = simActStudent();
        $outsider = simActStudent();
        simActEnroll($instructor, $student);
        simActEnroll($other, $outsider);

        simActCompletedSession($student);
        simActCompletedSession($outsider, ['tool' => 'location']);

        $response = $this->actingAs($instructor)
            ->getJson('/api/v1/instructor/simulator/sessions?tool=scanner')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tool', 'scanner')
            ->assertJsonPath('data.0.student.id', $student->id)
            ->assertJsonPath('data.0.result.attempts', 3)
            ->assertJsonPath('data.0.result.hints_used', 1)
            ->assertJsonPath('meta.total', 1);

        $this->assertStringNotContainsString($outsider->email, $response->getContent());
    });

    it('filters instructor sessions by vehicle and date', function () {
        $instructor = simActInstructor();
        $student = simActStudent();
        simActEnroll($instructor, $student);

        simActCompletedSession($student, [
            'vehicle_key' => 'hilux-an10',
            'started_at' => now()->subDays(2),
            'ended_at' => now()->subDays(2),
        ]);
        simActCompletedSession($student, [
            'vehicle_key' => 'corolla-1zr-fe',
            'started_at' => now()->subDays(30),
            'ended_at' => now()->subDays(30),
        ]);

        $this->actingAs($instructor)
            ->getJson('/api/v1/instructor/simulator/sessions?vehicle=corolla-1zr-fe')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehicle_key', 'corolla-1zr-fe');

        $this->actingAs($instructor)
            ->getJson('/api/v1/instructor/simulator/sessions?date_from='.now()->subDays(7)->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehicle_key', 'hilux-an10');
    });

    it('returns a single students simulator activity', function () {
        $instructor = simActInstructor();
        $student = simActStudent();
        simActEnroll($instructor, $student);
        simActCompletedSession($student);

        $this->actingAs($instructor)
            ->getJson("/api/v1/instructor/students/{$student->id}/simulator")
            ->assertOk()
            ->assertJsonPath('data.summary.sessions', 1)
            ->assertJsonPath('data.summary.completed', 1)
            ->assertJsonPath('data.summary.average_score', 82)
            ->assertJsonPath('data.summary.pass_rate', 100)
            ->assertJsonPath('data.sessions.0.tool', 'scanner')
            ->assertJsonPath('data.sessions.0.result.hints_used', 1);
    });

    it('hides simulator activity for students outside owned courses', function () {
        $instructor = simActInstructor();
        $other = simActInstructor();
        $outsider = simActStudent();
        simActEnroll($other, $outsider);
        simActCompletedSession($outsider);

        $this->actingAs($instructor)
            ->getJson("/api/v1/instructor/students/{$outsider->id}/simulator")
            ->assertNotFound();
    });

    it('includes simulator sessions on the student profile payload', function () {
        $instructor = simActInstructor();
        $student = User::factory()->create(['first_name' => 'Maya', 'last_name' => 'Diaz']);
        $student->assignRole('Student');
        simActEnroll($instructor, $student);
        simActCompletedSession($student);

        $this->actingAs($instructor)
            ->getJson("/api/v1/instructor/students/{$student->id}")
            ->assertOk()
            ->assertJsonPath('data.simulator.summary.sessions', 1)
            ->assertJsonPath('data.simulator.sessions.0.tool', 'scanner');
    });
});

describe('Admin simulator activity', function () {
    it('returns platform-wide analytics to admins', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $a = simActStudent();
        $b = simActStudent();
        simActEnroll($instructor, $a);
        simActEnroll($instructor, $b);

        simActCompletedSession($a);
        simActCompletedSession($b, ['tool' => 'schematic', 'score' => 55]);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/analytics')
            ->assertOk()
            ->assertJsonPath('data.totals.sessions', 2)
            ->assertJsonPath('data.totals.students', 2)
            ->assertJsonPath('data.totals.average_score', 69)
            ->assertJsonPath('data.totals.pass_rate', 100);
    });

    it('lists all sessions for admins', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $a = simActStudent();
        $b = simActStudent();
        simActEnroll($instructor, $a);
        simActEnroll($instructor, $b);
        simActCompletedSession($a);
        simActCompletedSession($b, ['tool' => 'oscilloscope']);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/sessions?per_page=50')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);
    });

    it('returns a students simulator journey by uuid', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $student = simActStudent();
        simActEnroll($instructor, $student);
        simActCompletedSession($student);

        $this->actingAs($admin)
            ->getJson("/api/v1/admin/students/{$student->uuid}/simulator")
            ->assertOk()
            ->assertJsonPath('data.summary.sessions', 1)
            ->assertJsonPath('data.sessions.0.tool', 'scanner');
    });

    it('includes simulator data in the admin student journey payload', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $student = simActStudent();
        simActEnroll($instructor, $student);
        simActCompletedSession($student);

        $this->actingAs($admin)
            ->getJson("/api/v1/admin/students/{$student->uuid}")
            ->assertOk()
            ->assertJsonPath('data.summary.simulator_sessions', 1)
            ->assertJsonPath('data.simulator.summary.sessions', 1);
    });

    it('filters sessions by vehicle and date range', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $student = simActStudent();
        simActEnroll($instructor, $student);

        simActCompletedSession($student, [
            'vehicle_key' => 'hilux-an10',
            'tool' => 'multimeter',
            'started_at' => now()->subDays(2),
            'ended_at' => now()->subDays(2),
        ]);
        simActCompletedSession($student, [
            'vehicle_key' => 'corolla-1zr-fe',
            'started_at' => now()->subDays(30),
            'ended_at' => now()->subDays(30),
        ]);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/sessions?vehicle=hilux-an10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehicle_key', 'hilux-an10')
            ->assertJsonPath('meta.total', 1);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/sessions?date_from='.now()->subDays(7)->toDateString().'&date_to='.now()->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehicle_key', 'hilux-an10');

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/sessions?date_to='.now()->subDays(10)->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehicle_key', 'corolla-1zr-fe');
    });

    it('exposes vehicles in analytics for the vehicle filter', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $student = simActStudent();
        simActEnroll($instructor, $student);

        simActCompletedSession($student, ['vehicle_key' => 'hilux-an10']);
        simActCompletedSession($student, ['vehicle_key' => 'corolla-1zr-fe']);
        simActCompletedSession($student, ['vehicle_key' => 'corolla-1zr-fe']);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/analytics')
            ->assertOk()
            ->assertJsonCount(2, 'data.by_vehicle')
            ->assertJsonPath('data.by_vehicle.0.vehicle_key', 'corolla-1zr-fe')
            ->assertJsonPath('data.by_vehicle.0.sessions', 2)
            ->assertJsonPath('data.by_vehicle.1.vehicle_key', 'hilux-an10')
            ->assertJsonPath('data.by_vehicle.1.sessions', 1);
    });

    it('lists every created vehicle in analytics, including unused ones with labels', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $student = simActStudent();
        simActEnroll($instructor, $student);

        $make = VehicleMake::query()->create(['name' => 'Toyota', 'slug' => 'toyota']);
        $model = VehicleModel::query()->create(['make_id' => $make->id, 'name' => 'Corolla', 'slug' => 'corolla']);
        $usedVariant = VehicleVariant::query()->create(['model_id' => $model->id, 'name' => '1.8']);
        $unusedVariant = VehicleVariant::query()->create(['model_id' => $model->id, 'name' => '2.0']);

        simActCompletedSession($student, ['vehicle_key' => $usedVariant->id]);
        simActCompletedSession($student, ['vehicle_key' => 'legacy-golf']);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/analytics')
            ->assertOk()
            ->assertJsonCount(3, 'data.by_vehicle')
            ->assertJsonPath('data.by_vehicle.0.vehicle_key', $usedVariant->id)
            ->assertJsonPath('data.by_vehicle.0.sessions', 1)
            ->assertJsonPath('data.by_vehicle.0.label', 'Toyota Corolla 1.8')
            ->assertJsonPath('data.by_vehicle.1.vehicle_key', 'legacy-golf')
            ->assertJsonPath('data.by_vehicle.1.sessions', 1)
            ->assertJsonPath('data.by_vehicle.1.label', null)
            ->assertJsonPath('data.by_vehicle.2.vehicle_key', $unusedVariant->id)
            ->assertJsonPath('data.by_vehicle.2.sessions', 0)
            ->assertJsonPath('data.by_vehicle.2.label', 'Toyota Corolla 2.0');
    });

    it('merges lab-prefixed vehicle keys into a single labeled row', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $student = simActStudent();
        simActEnroll($instructor, $student);

        $make = VehicleMake::query()->create(['name' => 'Toyota', 'slug' => 'toyota']);
        $model = VehicleModel::query()->create(['make_id' => $make->id, 'name' => 'Corolla', 'slug' => 'corolla']);
        $variant = VehicleVariant::query()->create(['model_id' => $model->id, 'name' => '1.8']);

        // The scanner lab sends its card key verbatim (`backend:<uuid>`).
        simActCompletedSession($student, ['vehicle_key' => 'backend:'.$variant->id]);
        simActCompletedSession($student, ['vehicle_key' => 'backend:'.$variant->id]);
        simActCompletedSession($student, ['vehicle_key' => $variant->id]);

        $analytics = $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/analytics');

        $analytics
            ->assertOk()
            ->assertJsonCount(1, 'data.by_vehicle')
            ->assertJsonPath('data.by_vehicle.0.vehicle_key', $variant->id)
            ->assertJsonPath('data.by_vehicle.0.sessions', 3)
            ->assertJsonPath('data.by_vehicle.0.label', 'Toyota Corolla 1.8');

        $leaked = collect($analytics->json('data.by_vehicle'))
            ->pluck('vehicle_key')
            ->filter(fn (string $key) => str_starts_with($key, 'backend:'));

        expect($leaked)->toBeEmpty();
    });

    it('filters sessions by vehicle whatever stored key form they use', function () {
        $instructor = simActInstructor();
        $admin = simActAdmin();
        $student = simActStudent();
        simActEnroll($instructor, $student);

        $make = VehicleMake::query()->create(['name' => 'Toyota', 'slug' => 'toyota']);
        $model = VehicleModel::query()->create(['make_id' => $make->id, 'name' => 'Corolla', 'slug' => 'corolla']);
        $variant = VehicleVariant::query()->create(['model_id' => $model->id, 'name' => '1.8']);

        simActCompletedSession($student, ['vehicle_key' => 'backend:'.$variant->id]);
        simActCompletedSession($student, ['vehicle_key' => $variant->id]);
        simActCompletedSession($student, ['vehicle_key' => 'other-static-key']);

        // Canonical value (what the dropdown sends) matches both stored forms.
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/sessions?vehicle='.$variant->id)
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // Prefixed value still resolves for links/queries built before the fix.
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/simulator/sessions?vehicle=backend:'.$variant->id)
            ->assertOk()
            ->assertJsonCount(2, 'data');
    });

    it('stores new sessions with the canonical vehicle key', function () {
        $student = simActStudent();

        $this->actingAs($student)
            ->postJson('/api/v1/simulator/sessions', [
                'vehicle_key' => 'backend:01a0ca1e-8c5a-7048-b0b0-247e264cf9ae',
                'tool' => 'scanner',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('simulator_sessions', [
            'user_id' => $student->id,
            'vehicle_key' => '01a0ca1e-8c5a-7048-b0b0-247e264cf9ae',
        ]);
    });

    it('denies instructors the admin simulator endpoints', function () {
        $instructor = simActInstructor();

        $this->actingAs($instructor)
            ->getJson('/api/v1/admin/simulator/analytics')
            ->assertForbidden();
    });
});
