<?php

use App\Models\Course;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


it('allows an authorized user to update a section', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    expect(
        $user->can('update', $section)
    )->toBeTrue();
});


it('denies an unauthorized user from updating a section', function () {

    $instructor = User::factory()->create();
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    expect(
        $user->can('update', $section)
    )->toBeFalse();
});