<?php

use App\Domains\Courses\Actions\PublishCourseAction;
use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\Events\CoursePublished;
use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('dispatches CoursePublished when a course is published', function () {
    Event::fake();

    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::DRAFT,
        'title' => 'Laravel Backend',
        'description' => 'Complete Laravel backend course.',
        'duration_minutes' => 120,
        'thumbnail' => 'media/course.jpg',
    ]);

    app(PublishCourseAction::class)->execute(
        new PublishCourseData(
            courseId: $course->id,
            publisherId: $instructor->id,
        )
    );

    Event::assertDispatched(
        CoursePublished::class,
        function (CoursePublished $event) use ($course) {
            return $event->course->is($course->fresh());
        }
    );
});