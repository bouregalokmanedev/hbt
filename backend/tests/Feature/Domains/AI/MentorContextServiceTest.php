<?php

use App\Domains\AI\Services\MentorContextService;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\CourseProgress;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\User;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\Lesson;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


it('builds context for a user without a course', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    expect($context->userId)
        ->toBe((string) $user->id)
        ->and($context->courseId)
        ->toBeNull()
        ->and($context->course)
        ->toBe([]);
});

it('builds context for an enrolled course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $context = app(MentorContextService::class)
        ->build(
            $user,
            $course->id,
        );

    expect($context->userId)
        ->toBe((string) $user->id)
        ->and($context->courseId)
        ->toBe($course->id)
        ->and($context->course['id'])
        ->toBe($course->id)
        ->and($context->course['title'])
        ->toBe($course->title);
});

it('does not expose a course the user is not enrolled in', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $context = app(MentorContextService::class)
        ->build(
            $user,
            $course->id,
        );

    expect($context->courseId)
        ->toBeNull()
        ->and($context->course)
        ->toBe([]);
});

it('preserves the current lesson in the context', function () {
    $user = User::factory()->create();

    $lessonId = 'lesson-123';

    $context = app(MentorContextService::class)
        ->build(
            $user,
            null,
            $lessonId,
        );

    expect($context->lessonId)
        ->toBe($lessonId);
});

it('can serialize the context', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    expect($context->toArray())
        ->toHaveKeys([
            'user_id',
            'course_id',
            'lesson_id',
            'course',
            'progress',
            'assessments',
            'quizzes',
            'diagnostic_scenarios',
        ]);
});
it('includes the student profile in the mentor context', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    expect($context->studentProfile)
        ->not->toBeNull();

    expect($context->studentProfile->userId)
        ->toBe((string) $user->id);
});
it('serializes the student profile in the mentor context', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    expect($context->toArray())
        ->toHaveKey('student_profile');

    expect($context->toArray()['student_profile'])
        ->toHaveKeys([
            'user_id',
            'course_id',
            'learning_level',
            'overall_progress',
            'course_progress',
            'lesson_progress',
            'quiz_performance',
            'assessment_performance',
            'diagnostic_performance',
            'courses_started',
            'courses_completed',
        ]);
});
it('includes a course-specific student profile', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 73,
    ]);

    $context = app(MentorContextService::class)
        ->build(
            $user,
            (string) $course->id,
        );

    expect($context->studentProfile->courseId)
        ->toBe((string) $course->id);

    expect($context->studentProfile->courseProgress)
        ->toBe(73);
});

it('includes the student profile', function () {

    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    $this->assertNotNull(
        $context->studentProfile
    );

    $this->assertSame(
        (string) $user->id,
        $context->studentProfile->userId
    );
});

it('includes the student adaptation', function () {

    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    $this->assertNotNull(
        $context->adaptation
    );
});

it('builds adaptation from the student profile', function () {

    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    $this->assertSame(
        $context->studentProfile->level->value,
        $context->adaptation->learningLevel
    );
});

it('serializes student profile and adaptation', function() {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    $data = $context->toArray();

    $this->assertArrayHasKey(
        'student_profile',
        $data
    );

    $this->assertArrayHasKey(
        'adaptation',
        $data
    );

    $this->assertIsArray(
        $data['student_profile']
    );

    $this->assertIsArray(
        $data['adaptation']
    );
});
it('includes the lesson context when a current lesson is provided', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $context = app(MentorContextService::class)
        ->build(
            $user,
            $course->id,
            $lesson->id,
        );

    expect($context->lessonId)
        ->toBe($lesson->id);
});

it('serializes the lesson context', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $context = app(MentorContextService::class)
        ->build(
            $user,
            $course->id,
            $lesson->id,
        );

    $data = $context->toArray();

    expect($data)
        ->toHaveKey('lesson_context')
        ->and($data['lesson_context'])
        ->toBeArray();

    expect($data['lesson_context']['lesson_id'])
        ->toBe((string) $lesson->id);

    expect($data['lesson_context']['course_id'])
        ->toBe((string) $course->id);

    expect($data['lesson_context']['section_id'])
        ->toBe((string) $section->id);
});
it('includes quiz context in the mentor context', function () {
    $user = User::factory()->create();

    $section = Section::factory()->create();

    $quiz = \App\Domains\Quizzes\Models\Quiz::factory()->create([
        'section_id' => $section->id,
        'title' => 'Engine Diagnostic Quiz',
    ]);

    \App\Domains\Quizzes\Models\QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'status' => \App\Domains\Quizzes\Enums\QuizAttemptStatus::SUBMITTED,
        'score' => 40,
        'total_points' => 50,
        'percentage' => 80,
        'passed' => true,
        'submitted_at' => now(),
    ]);

    $context = app(MentorContextService::class)
        ->build($user);

    expect($context->quizzes)
        ->not->toBeEmpty();

    expect($context->quizzes['attempt_count'])
        ->toBe(1);

    expect($context->quizzes['latest']['quiz_id'])
        ->toBe($quiz->id);

    expect($context->quizzes['latest']['percentage'])
        ->toBe(80);

    expect($context->quizzes['latest']['passed'])
        ->toBeTrue();
});
it('includes only quiz attempts from the requested course', function () {
    $user = User::factory()->create();

    $courseA = Course::factory()->create();
    $courseB = Course::factory()->create();

    $sectionA = Section::factory()->create([
        'course_id' => $courseA->id,
    ]);

    $sectionB = Section::factory()->create([
        'course_id' => $courseB->id,
    ]);

    $quizA = \App\Domains\Quizzes\Models\Quiz::factory()->create([
        'section_id' => $sectionA->id,
    ]);

    $quizB = \App\Domains\Quizzes\Models\Quiz::factory()->create([
        'section_id' => $sectionB->id,
    ]);

    \App\Domains\Quizzes\Models\QuizAttempt::factory()->create([
        'quiz_id' => $quizA->id,
        'user_id' => $user->id,
        'status' => \App\Domains\Quizzes\Enums\QuizAttemptStatus::SUBMITTED,
        'percentage' => 80,
        'passed' => true,
        'submitted_at' => now(),
    ]);

    \App\Domains\Quizzes\Models\QuizAttempt::factory()->create([
        'quiz_id' => $quizB->id,
        'user_id' => $user->id,
        'status' => \App\Domains\Quizzes\Enums\QuizAttemptStatus::SUBMITTED,
        'percentage' => 40,
        'passed' => false,
        'submitted_at' => now(),
    ]);

    $context = app(MentorContextService::class)
        ->build($user, $courseA->id);

    expect($context->quizzes['attempt_count'])
        ->toBe(1);

    expect($context->quizzes['latest']['quiz_id'])
        ->toBe($quizA->id);
});
it('retrieves course content for the current mentor question', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
        'title' => 'MAF Sensor Diagnostics',
        'content' => 'The MAF sensor measures the mass airflow entering the engine.',
    ]);

    $context = app(MentorContextService::class)->build(
        user: $user,
        courseId: $course->id,
        query: 'What does the MAF sensor measure?',
    );

    expect($context->retrievedChunks)
        ->not->toBeEmpty();

    expect($context->retrievedChunks[0]->sourceId)
        ->toBe($lesson->id);
});
it('serializes retrieved course content', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
        'title' => 'MAF Sensor',
        'content' => 'Mass airflow measurement.',
    ]);

    $context = app(MentorContextService::class)->build(
        user: $user,
        courseId: $course->id,
        query: 'MAF sensor',
    );

    $data = $context->toArray();

    expect($data)
        ->toHaveKey('retrieved_chunks')
        ->and($data['retrieved_chunks'])
        ->toBeArray()
        ->not->toBeEmpty();

    expect($data['retrieved_chunks'][0])
        ->toHaveKeys([
            'content',
            'source_type',
            'source_id',
            'title',
            'score',
            'metadata',
        ]);
});