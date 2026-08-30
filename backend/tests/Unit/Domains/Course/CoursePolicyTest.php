<?php

use App\Domains\Courses\Policies\CoursePolicy;
use App\Models\Course;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
});

it('allows an instructor to manage only their own course', function () {
    $owner = User::factory()->create();
    $owner->assignRole('Instructor');

    $otherInstructor = User::factory()->create();
    $otherInstructor->assignRole('Instructor');

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    $policy = app(CoursePolicy::class);

    expect($policy->update($owner, $course))->toBeTrue()
        ->and($policy->update($otherInstructor, $course))->toBeFalse()
        ->and($policy->publish($otherInstructor, $course))->toBeFalse()
        ->and($policy->delete($otherInstructor, $course))->toBeFalse();
});

it('allows an administrator to manage any course', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $course = Course::factory()->create();

    $policy = app(CoursePolicy::class);

    expect($policy->update($admin, $course))->toBeTrue()
        ->and($policy->publish($admin, $course))->toBeTrue();
});
