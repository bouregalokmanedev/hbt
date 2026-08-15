<?php

use App\Domains\Courses\Services\CourseProgressService;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\Courses\Events\CourseCompleted;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);


beforeEach(function () {
    $this->service = app(CourseProgressService::class);

    $this->user = User::factory()->create();

    $this->course = Course::factory()->create();

    $this->sectionOne = Section::factory()->create([
        'course_id' => $this->course->id,
        'position' => 1,
    ]);

    $this->sectionTwo = Section::factory()->create([
        'course_id' => $this->course->id,
        'position' => 2,
    ]);

    $this->sectionThree = Section::factory()->create([
        'course_id' => $this->course->id,
        'position' => 3,
    ]);
});

it('creates course progress', function () {
    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress)
        ->toBeInstanceOf(CourseProgress::class)
        ->and($progress->user_id)
        ->toBe($this->user->id)
        ->and($progress->course_id)
        ->toBe($this->course->id);
});

it('calculates course progress percentage from section progress', function () {
    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionOne->id,
        'progress_percentage' => 100,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionTwo->id,
        'progress_percentage' => 50,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionThree->id,
        'progress_percentage' => 0,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(50);
});

it('calculates aggregate time spent from section progress', function () {
    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionOne->id,
        'time_spent' => 120,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionTwo->id,
        'time_spent' => 300,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionThree->id,
        'time_spent' => 80,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->time_spent)
        ->toBe(500);
});

it('uses the earliest section started timestamp', function () {
    $earliest = now()->startOfSecond();
    $later = $earliest->copy()->addMinutes(5);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionOne->id,
        'started_at' => $later,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionTwo->id,
        'started_at' => $earliest,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->started_at)
        ->toEqual($earliest);
});

it('leaves started_at null when no section has started', function () {
    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->started_at)
        ->toBeNull();
});

it('marks the course completed when all sections reach 100 percent', function () {
    foreach ([
        $this->sectionOne,
        $this->sectionTwo,
        $this->sectionThree,
    ] as $section) {
        SectionProgress::factory()->create([
            'user_id' => $this->user->id,
            'section_id' => $section->id,
            'progress_percentage' => 100,
            'completed_at' => now()->startOfSecond(),
        ]);
    }

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(100)
        ->and($progress->completed_at)
        ->not->toBeNull();
});

it('does not mark the course completed when any section is incomplete', function () {
    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionOne->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionTwo->id,
        'progress_percentage' => 50,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionThree->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(83)
        ->and($progress->completed_at)
        ->toBeNull();
});

it('does not create duplicate course progress', function () {
    $first = $this->service->sync(
        $this->user,
        $this->course
    );

    $second = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($second->id)
        ->toBe($first->id)
        ->and(
            CourseProgress::query()
                ->where('user_id', $this->user->id)
                ->where('course_id', $this->course->id)
                ->count()
        )
        ->toBe(1);
});

it('updates existing course progress', function () {
    $existing = CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 20,
        'time_spent' => 100,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionOne->id,
        'progress_percentage' => 100,
        'time_spent' => 300,
    ]);

    $result = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($result->id)
        ->toBe($existing->id)
        ->and($result->progress_percentage)
        ->toBe(33)
        ->and($result->time_spent)
        ->toBe(300);
});

it('treats sections without progress as zero percent', function () {
    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionOne->id,
        'progress_percentage' => 100,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(33);
});

it('ignores another users section progress', function () {
    $otherUser = User::factory()->create();

    SectionProgress::factory()->create([
        'user_id' => $otherUser->id,
        'section_id' => $this->sectionOne->id,
        'progress_percentage' => 100,
        'time_spent' => 999,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0);
});

it('ignores section progress belonging to another course', function () {
    $otherCourse = Course::factory()->create();

    $otherSection = Section::factory()->create([
        'course_id' => $otherCourse->id,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $otherSection->id,
        'progress_percentage' => 100,
        'time_spent' => 999,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0);
});

it('handles a course with no sections', function () {
    $course = Course::factory()->create();

    $progress = $this->service->sync(
        $this->user,
        $course
    );

    expect($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0)
        ->and($progress->started_at)
        ->toBeNull()
        ->and($progress->completed_at)
        ->toBeNull();
});
it('finds existing course progress for the user', function () {
    $progress = CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 65,
        'time_spent' => 1800,
    ]);

    $result = $this->service->find(
        $this->user,
        $this->course
    );

    expect($result)
        ->toBeInstanceOf(CourseProgress::class)
        ->and($result->id)
        ->toBe($progress->id)
        ->and($result->progress_percentage)
        ->toBe(65)
        ->and($result->time_spent)
        ->toBe(1800);
});

it('returns null when the user has no course progress', function () {
    $result = $this->service->find(
        $this->user,
        $this->course
    );

    expect($result)->toBeNull();
});

it('does not find another users course progress', function () {
    $otherUser = User::factory()->create();

    CourseProgress::factory()->create([
        'user_id' => $otherUser->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 80,
    ]);

    $result = $this->service->find(
        $this->user,
        $this->course
    );

    expect($result)->toBeNull();
});
it('completes the course when all sections reach 100 percent', function () {
    foreach ($this->course->sections()->get() as $section) {
        SectionProgress::factory()->create([
            'user_id' => $this->user->id,
            'section_id' => $section->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);
    }

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(100)
        ->and($progress->completed_at)
        ->not->toBeNull();
});
it('does not complete the course when any section is incomplete', function () {
    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionOne->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionTwo->id,
        'progress_percentage' => 50,
        'completed_at' => null,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->sectionThree->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(83)
        ->and($progress->completed_at)
        ->toBeNull();
});
it('dispatches CourseCompleted when course reaches 100 percent', function () {
    Event::fake();

    foreach ([
        $this->sectionOne,
        $this->sectionTwo,
        $this->sectionThree,
    ] as $section) {
        SectionProgress::factory()->create([
            'user_id' => $this->user->id,
            'section_id' => $section->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);
    }

    $progress = $this->service->sync(
        $this->user,
        $this->course
    );

    expect($progress->progress_percentage)
        ->toBe(100)
        ->and($progress->completed_at)
        ->not->toBeNull();

    Event::assertDispatched(
        CourseCompleted::class,
        function (CourseCompleted $event) use ($progress) {
            return $event->progress->id === $progress->id;
        }
    );
});
it('does not dispatch CourseCompleted again for an already completed course', function () {
    Event::fake();

    $existing = CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 100,
        'completed_at' => now()->startOfSecond(),
    ]);

    foreach ([
        $this->sectionOne,
        $this->sectionTwo,
    ] as $section) {
        SectionProgress::factory()->create([
            'user_id' => $this->user->id,
            'section_id' => $section->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);
    }

    $result = $this->service->sync(
        $this->user,
        $this->course
    );

    Event::assertNotDispatched(CourseCompleted::class);

    expect($result->completed_at)
        ->toEqual($existing->completed_at);
});