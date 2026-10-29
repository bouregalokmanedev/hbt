<?php

use App\Domains\Lessons\Services\LessonAccessService;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;

beforeEach(function () {
    $this->service = app(LessonAccessService::class);

    $this->user = User::factory()->create();

    $this->course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $this->section = Section::factory()->create([
        'course_id' => $this->course->id,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $this->lesson = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);
});

it('allows an actively enrolled student to access a published lesson', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    expect(
        $this->service->canAccess(
            $this->user,
            $this->lesson
        )
    )->toBeTrue();
});

it('denies a user without an enrollment', function () {
    expect(
        $this->service->canAccess(
            $this->user,
            $this->lesson
        )
    )->toBeFalse();
});

it('denies a cancelled enrollment', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::CANCELLED,
    ]);

    expect(
        $this->service->canAccess(
            $this->user,
            $this->lesson
        )
    )->toBeFalse();
});

it('allows a completed enrollment to retain content access', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::COMPLETED,
    ]);

    expect(
        $this->service->canAccess(
            $this->user,
            $this->lesson
        )
    )->toBeTrue();
});

it('denies a draft lesson', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $this->lesson->update([
        'status' => LessonStatus::DRAFT,
    ]);

    expect(
        $this->service->canAccess(
            $this->user,
            $this->lesson
        )
    )->toBeFalse();
});

it('denies a lesson in a draft section', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $this->section->update([
        'status' => SectionStatus::DRAFT,
    ]);

    expect(
        $this->service->canAccess(
            $this->user,
            $this->lesson
        )
    )->toBeFalse();
});

it('denies a lesson in an unpublished course', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $this->course->update([
        'status' => CourseStatus::DRAFT,
    ]);

    expect(
        $this->service->canAccess(
            $this->user,
            $this->lesson
        )
    )->toBeFalse();
});

it('unlocks the next lesson only after the previous one is complete', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $next = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'status' => LessonStatus::PUBLISHED,
        'position' => 2,
    ]);

    expect($this->service->canAccess($this->user, $next))->toBeFalse();

    LessonProgress::factory()->completed()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
    ]);

    expect($this->service->canAccess($this->user, $next))->toBeTrue();
});

it('lets a completed enrollment review every lesson even with legacy gaps', function () {
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::COMPLETED,
    ]);

    $next = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'status' => LessonStatus::PUBLISHED,
        'position' => 2,
    ]);

    // No LessonProgress rows at all: the enrollment is the authority.
    expect($this->service->canAccess($this->user, $next))->toBeTrue();
});