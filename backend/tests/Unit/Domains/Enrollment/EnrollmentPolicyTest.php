<?php

use App\Models\Enrollment;
use App\Models\User;
use App\Domains\Enrollments\Policies\EnrollmentPolicy;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
});

it('allows a user to create an enrollment', function () {
    $user = User::factory()->create();
    $policy = app(EnrollmentPolicy::class);

    expect($policy->create($user))->toBeTrue();
});

it('allows a user to view their own enrollment', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->view($user, $enrollment)
    )->toBeTrue();
});

it('does not allow a user to view another users enrollment', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
    ]);

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->view($otherUser, $enrollment)
    )->toBeFalse();
});

it('allows an admin to view another users enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $owner = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
    ]);

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->view($admin, $enrollment)
    )->toBeTrue();
});

it('allows a user to cancel their own enrollment', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->cancel($user, $enrollment)
    )->toBeTrue();
});

it('does not allow a user to cancel another users enrollment', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
    ]);

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->cancel($otherUser, $enrollment)
    )->toBeFalse();
});

it('allows an admin to cancel another users enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $owner = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $owner->id,
    ]);

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->cancel($admin, $enrollment)
    )->toBeTrue();
});

it('does not allow a normal user to complete an enrollment', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->complete($user, $enrollment)
    )->toBeFalse();
});

it('allows an admin to complete an enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $enrollment = Enrollment::factory()->create();

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->complete($admin, $enrollment)
    )->toBeTrue();
});

it('allows a super admin to complete an enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Super Admin');

    $enrollment = Enrollment::factory()->create();

    $policy = app(EnrollmentPolicy::class);

    expect(
        $policy->complete($admin, $enrollment)
    )->toBeTrue();
});
