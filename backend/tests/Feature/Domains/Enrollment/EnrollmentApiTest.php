<?php

use App\Http\Controllers\Api\V1\EnrollmentController;
use App\Domains\Enrollments\Events\EnrollmentCancelled;
use App\Domains\Enrollments\Events\EnrollmentCompleted;
use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Domains\Enrollments\Exceptions\AlreadyEnrolledException;
use App\Domains\Enrollments\Exceptions\CourseNotAvailableForEnrollment;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
});

it('requires authentication to list enrollments', function () {
    $this->getJson('/api/v1/enrollments')
        ->assertUnauthorized();
});

it('returns only the authenticated users enrollments', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $ownEnrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    Enrollment::factory()->create([
        'user_id' => $otherUser->id,
    ]);

    Sanctum::actingAs($user);

    $this->getJson('/api/v1/enrollments')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath(
            'data.0.id',
            $ownEnrollment->id
        )
        ->assertJsonPath(
            'data.0.user_id',
            $user->id
        );
});

it('creates an enrollment', function () {
    Event::fake();

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/enrollments', [
        'course_id' => $course->id,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.user_id', $user->id)
        ->assertJsonPath('data.course_id', $course->id)
        ->assertJsonPath('data.status', EnrollmentStatus::ACTIVE->value);

    $enrollment = Enrollment::query()
        ->where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->first();

    expect($enrollment)->not->toBeNull();

    Event::assertDispatched(
        EnrollmentCreated::class,
        fn (EnrollmentCreated $event) =>
            $event->enrollment->is($enrollment)
    );
});

it('requires a course id when creating an enrollment', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/enrollments')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['course_id']);
});

it('requires the course id to be a uuid', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/enrollments', [
        'course_id' => 'not-a-uuid',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['course_id']);
});

it('rejects a nonexistent course', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/enrollments', [
        'course_id' => '11111111-1111-4111-8111-111111111111',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['course_id']);
});

it('rejects enrollment into an unavailable course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
        'visibility' => Visibility::PUBLIC,
    ]);

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/enrollments', [
        'course_id' => $course->id,
    ])
        ->assertStatus(422);

    expect(
        Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists()
    )->toBeFalse();
});

it('rejects duplicate enrollment', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/enrollments', [
        'course_id' => $course->id,
    ])
        ->assertStatus(422);
});

it('allows the owner to view an enrollment', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    Sanctum::actingAs($user);

    $this->getJson("/api/v1/enrollments/{$enrollment->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $enrollment->id)
        ->assertJsonPath('data.user_id', $user->id);
});

it('does not allow another user to view an enrollment', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
    ]);

    Sanctum::actingAs($otherUser);

    $this->getJson("/api/v1/enrollments/{$enrollment->id}")
        ->assertForbidden();
});

it('allows an admin to view another users enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $owner = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
    ]);

    Sanctum::actingAs($admin);

    $this->getJson("/api/v1/enrollments/{$enrollment->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $enrollment->id);
});

it('does not allow a normal user to complete an enrollment', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    Sanctum::actingAs($user);

    $this->postJson(
        "/api/v1/enrollments/{$enrollment->id}/complete"
    )
        ->assertForbidden();
});

it('allows an admin to complete an enrollment', function () {
    Event::fake();

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $enrollment = Enrollment::factory()->create([
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    Sanctum::actingAs($admin);

    $this->postJson(
        "/api/v1/enrollments/{$enrollment->id}/complete"
    )
        ->assertOk()
        ->assertJsonPath(
            'data.status',
            EnrollmentStatus::COMPLETED->value
        );

    $enrollment->refresh();

    expect($enrollment->status)
        ->toBe(EnrollmentStatus::COMPLETED)
        ->and($enrollment->completed_at)
        ->not->toBeNull()
        ->and($enrollment->cancelled_at)
        ->toBeNull();

    Event::assertDispatched(
        EnrollmentCompleted::class,
        fn (EnrollmentCompleted $event) =>
            $event->enrollment->is($enrollment)
    );
});

it('cannot complete an already completed enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $enrollment = Enrollment::factory()->completed()->create();

    Sanctum::actingAs($admin);

    $this->postJson(
        "/api/v1/enrollments/{$enrollment->id}/complete"
    )
        ->assertStatus(422);
});

it('allows the owner to cancel an enrollment', function () {
    Event::fake();

    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    Sanctum::actingAs($user);

    $this->postJson(
        "/api/v1/enrollments/{$enrollment->id}/cancel"
    )
        ->assertOk()
        ->assertJsonPath(
            'data.status',
            EnrollmentStatus::CANCELLED->value
        );

    $enrollment->refresh();

    expect($enrollment->status)
        ->toBe(EnrollmentStatus::CANCELLED)
        ->and($enrollment->cancelled_at)
        ->not->toBeNull()
        ->and($enrollment->completed_at)
        ->toBeNull();

    Event::assertDispatched(
        EnrollmentCancelled::class,
        fn (EnrollmentCancelled $event) =>
            $event->enrollment->is($enrollment)
    );
});

it('does not allow another user to cancel an enrollment', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    Sanctum::actingAs($otherUser);

    $this->postJson(
        "/api/v1/enrollments/{$enrollment->id}/cancel"
    )
        ->assertForbidden();
});

it('allows an admin to cancel another users enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $owner = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    Sanctum::actingAs($admin);

    $this->postJson(
        "/api/v1/enrollments/{$enrollment->id}/cancel"
    )
        ->assertOk()
        ->assertJsonPath(
            'data.status',
            EnrollmentStatus::CANCELLED->value
        );
});

it('cannot cancel a completed enrollment', function () {
    $user = User::factory()->create();
    $user->assignRole('Admin');

    $enrollment = Enrollment::factory()->completed()->create();

    Sanctum::actingAs($user);

    $this->postJson(
        "/api/v1/enrollments/{$enrollment->id}/cancel"
    )
        ->assertStatus(422);
});