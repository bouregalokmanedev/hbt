<?php

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
use App\Domains\Lessons\Exceptions\LessonCannotBeCompletedException;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(LessonProgressService::class);

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

function enrollLessonProgressTestUser(
    User $user,
    Course $course,
    EnrollmentStatus $status = EnrollmentStatus::ACTIVE
): Enrollment {
    return Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => $status,
    ]);
}

it('allows an actively enrolled student to complete a published lesson', function () {
    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $progress = $this->service->complete(
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

it('dispatches LessonCompleted for a new completion', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $progress = $this->service->complete(
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

it('rejects a user without an enrollment', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    expect(fn () => $this->service->complete(
        $this->user,
        $this->lesson
    ))->toThrow(LessonCannotBeCompletedException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

it('rejects a cancelled enrollment', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course,
        EnrollmentStatus::CANCELLED
    );

    expect(fn () => $this->service->complete(
        $this->user,
        $this->lesson
    ))->toThrow(LessonCannotBeCompletedException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

it('rejects a completed enrollment', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course,
        EnrollmentStatus::COMPLETED
    );

    expect(fn () => $this->service->complete(
        $this->user,
        $this->lesson
    ))->toThrow(LessonCannotBeCompletedException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

it('rejects a draft lesson', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $this->lesson->update([
        'status' => LessonStatus::DRAFT,
    ]);

    expect(fn () => $this->service->complete(
        $this->user,
        $this->lesson
    ))->toThrow(LessonCannotBeCompletedException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

it('rejects a lesson in a draft section', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $this->section->update([
        'status' => SectionStatus::DRAFT,
    ]);

    expect(fn () => $this->service->complete(
        $this->user,
        $this->lesson
    ))->toThrow(LessonCannotBeCompletedException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

it('rejects a lesson in an unpublished course', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $this->course->update([
        'status' => CourseStatus::DRAFT,
    ]);

    expect(fn () => $this->service->complete(
        $this->user,
        $this->lesson
    ))->toThrow(LessonCannotBeCompletedException::class);

    expect(LessonProgress::query()->count())
        ->toBe(0);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});

it('does not create duplicate progress when the lesson is already completed', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $existing = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
    ]);

    $result = $this->service->complete(
        $this->user,
        $this->lesson
    );

    expect($result->is($existing))
        ->toBeTrue()
        ->and(
            LessonProgress::query()
                ->where('user_id', $this->user->id)
                ->where('lesson_id', $this->lesson->id)
                ->count()
        )
        ->toBe(1);

    Event::assertNotDispatched(
        LessonCompleted::class
    );
});
it('updates lesson progress percentage', function () {
    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
        'progress_percentage' => 20,
    ]);

    $result = $this->service->updateProgress(
        $this->user,
        $this->lesson,
        [
            'progress_percentage' => 65,
        ]
    );

    expect($result->is($progress))
        ->toBeTrue()
        ->and($result->progress_percentage)
        ->toBe(65);
});
it('updates lesson progress tracking fields', function () {
    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
        'progress_percentage' => 20,
        'time_spent' => 60,
        'last_position' => 30,
        'video_position' => 30,
    ]);

    $result = $this->service->updateProgress(
        $this->user,
        $this->lesson,
        [
            'progress_percentage' => 65,
            'time_spent' => 180,
            'last_position' => 120,
            'video_position' => 120,
        ]
    );

    expect($result->is($progress))
        ->toBeTrue()
        ->and($result->progress_percentage)
        ->toBe(65)
        ->and($result->time_spent)
        ->toBe(180)
        ->and($result->last_position)
        ->toBe(120)
        ->and($result->video_position)
        ->toBe(120);
});
it('sets started_at when lesson progress starts', function () {
    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
        'started_at' => null,
        'progress_percentage' => 0,
    ]);

    $result = $this->service->updateProgress(
        $this->user,
        $this->lesson,
        [
            'progress_percentage' => 10,
        ]
    );

    expect($result->started_at)
        ->not->toBeNull()
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});
it('preserves the original started_at on subsequent progress updates', function () {
    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $startedAt = now()
        ->subMinutes(15)
        ->startOfSecond();

    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
        'started_at' => $startedAt,
        'progress_percentage' => 20,
    ]);

    $result = $this->service->updateProgress(
        $this->user,
        $this->lesson,
        [
            'progress_percentage' => 50,
        ]
    );

    expect($result->started_at)
        ->toEqual($startedAt);
});
it('completes the lesson when progress reaches 100 percent', function () {
    Event::fake([
        LessonCompleted::class,
    ]);

    enrollLessonProgressTestUser(
        $this->user,
        $this->course
    );

    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
        'progress_percentage' => 80,
        'completed_at' => null,
    ]);

    $result = $this->service->updateProgress(
        $this->user,
        $this->lesson,
        [
            'progress_percentage' => 100,
        ]
    );

    expect($result->progress_percentage)
        ->toBe(100)
        ->and($result->completed_at)
        ->not->toBeNull();

    Event::assertDispatched(
        LessonCompleted::class,
        function (LessonCompleted $event) use ($result) {
            return $event->progress->is($result);
        }
    );
});