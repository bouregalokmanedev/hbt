<?php

use App\Domains\Courses\Events\CourseArchived;
use App\Domains\Courses\Events\CourseDeleted;
use App\Domains\Courses\Events\CourseRestored;
use App\Domains\Courses\Events\CourseSubmittedForReview;
use App\Domains\Courses\Events\CourseUpdated;
use App\Models\Course;

it('creates a course archived event with the course', function () {
    $course = Course::factory()->make();

    $event = new CourseArchived($course);

    expect($event->course)->toBe($course);
});

it('creates a course restored event with the course', function () {
    $course = Course::factory()->make();

    $event = new CourseRestored($course);

    expect($event->course)->toBe($course);
});

it('creates a course submitted for review event with the course', function () {
    $course = Course::factory()->make();

    $event = new CourseSubmittedForReview($course);

    expect($event->course)->toBe($course);
});

it('creates a course deleted event with the course', function () {
    $course = Course::factory()->make();

    $event = new CourseDeleted($course);

    expect($event->course)->toBe($course);
});

it('creates a course updated event with the course', function () {
    $course = Course::factory()->make();

    $event = new CourseUpdated($course);

    expect($event->course)->toBe($course);
});
