<?php

use App\Domains\Lessons\Actions\CompleteLessonAction;
use App\Domains\Lessons\Events\LessonCompleted;
use App\Domains\Lessons\Services\LessonProgressService;
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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->action = app(CompleteLessonAction::class);

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

    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);
});

it('completes a lesson for an actively enrolled student', function () {
    $progress = $this->action->execute(
        $this->user,
        $this->lesson
    );

    expect($progress)
        ->toBeInstanceOf(LessonProgress::class)
        ->and($progress->user_id)
        ->toBe($this->user->id)
        ->and($progress->lesson_id)
        ->toBe($this->lesson->id)
        ->and($progress->completed_at)
        ->not->toBeNull();
});

it('persists the lesson completion', function () {
    $this->action->execute(
        $this->user,
        $this->lesson
    );

    expect(
        LessonProgress::query()
            ->where('user_id', $this->user->id)
            ->where('lesson_id', $this->lesson->id)
            ->exists()
    )->toBeTrue();
});

it('dispatches LessonCompleted for a new completion', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    $progress = $this->action->execute(
        $this->user,
        $this->lesson
    );

    Event::assertDispatched(
        LessonCompleted::class,
        function (LessonCompleted $event) use ($progress) {
            return $event->progress->is($progress);
        }
    );
});

it('does not create duplicate progress when executed twice', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    $first = $this->action->execute(
        $this->user,
        $this->lesson
    );

    $second = $this->action->execute(
        $this->user,
        $this->lesson
    );

    expect($second->is($first))
        ->toBeTrue()
        ->and(
            LessonProgress::query()
                ->where('user_id', $this->user->id)
                ->where('lesson_id', $this->lesson->id)
                ->count()
        )
        ->toBe(1);

    Event::assertDispatchedTimes(
        LessonCompleted::class,
        1
    );
});

it('returns the existing progress when the lesson is already completed', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    $existing = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
    ]);

    $result = $this->action->execute(
        $this->user,
        $this->lesson
    );

    expect($result->is($existing))
        ->toBeTrue();

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

it('rejects completion when the student cannot access the lesson', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    $otherUser = User::factory()->create();

    expect(fn () => $this->action->execute(
        $otherUser,
        $this->lesson
    ))->toThrow(\RuntimeException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

/*  it('does not dispatch completion when the service fails', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    $service = Mockery::mock(
        LessonProgressService::class
    );

    $service
        ->shouldReceive('complete')
        ->once()
        ->andThrow(new RuntimeException('Completion failed'));

    app()->instance(
        LessonProgressService::class,
        $service
    );

    expect(fn () => app(CompleteLessonAction::class)->execute(
        $this->user,
        $this->lesson
    ))->toThrow(RuntimeException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});
 */