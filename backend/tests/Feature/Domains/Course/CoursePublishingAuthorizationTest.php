<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

use App\Models\Course;
use App\Models\Section;
use App\Models\Lesson;
use App\Domains\Courses\Actions\PublishCourseAction;
use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\Exceptions\CourseAlreadyPublishedException;
use App\Domains\Courses\Exceptions\CourseArchivedException;
use Spatie\Permission\Models\Role;


uses(RefreshDatabase::class);
beforeEach(function () {
    Storage::fake('public');

    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
});



it('allows an instructor to publish their own course', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    expect($instructor->can('publish', $course))
        ->toBeTrue();
});

it('does not allow an instructor to publish another instructors course', function () {
    $owner = User::factory()->create();
    $otherInstructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    expect($otherInstructor->can('publish', $course))
        ->toBeFalse();
});

it('allows an admin to publish any course', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $owner = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    expect($admin->can('publish', $course))
        ->toBeTrue();
});

it('does not allow a normal user to publish a course', function () {
    $owner = User::factory()->create();
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    expect($user->can('publish', $course))
        ->toBeFalse();
});