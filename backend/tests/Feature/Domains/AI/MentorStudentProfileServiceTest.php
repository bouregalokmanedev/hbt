<?php

use App\Domains\AI\Enums\MentorLearningLevel;
use App\Domains\AI\Services\MentorStudentProfileService;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('builds a profile for a student with no learning history', function () {
    $user = User::factory()->create();

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->userId)
        ->toBe((string) $user->id);

    expect($profile->level)
        ->toBe(MentorLearningLevel::BEGINNER);

    expect($profile->overallProgress)
        ->toBe(0);

    expect($profile->quizPerformance)
        ->toBe(0);

    expect($profile->diagnosticPerformance)
        ->toBe(0);

    expect($profile->coursesStarted)
        ->toBe(0);

    expect($profile->coursesCompleted)
        ->toBe(0);
});

it('calculates course progress from course progress records', function () {
    $user = User::factory()->create();

    $courseA = Course::factory()->create();
    $courseB = Course::factory()->create();

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $courseA->id,
        'progress_percentage' => 80,
        'completed_at' => null,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $courseB->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->coursesStarted)
        ->toBe(2);

    expect($profile->coursesCompleted)
        ->toBe(1);

    expect($profile->overallProgress)
        ->toBe(90);
});

it('calculates average lesson progress', function () {
    $user = User::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'progress_percentage' => 60,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->lessonProgress)
        ->toBe(80);
});

it('calculates quiz performance from submitted attempts', function () {
    $user = User::factory()->create();

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 80,
        'status' => 'submitted',
    ]);

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 60,
        'status' => 'submitted',
    ]);

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 20,
        'status' => 'in_progress',
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->quizPerformance)
        ->toBe(70);
});

it('calculates diagnostic performance from completed attempts', function () {
    $user = User::factory()->create();

    DiagnosticScenarioAttempt::factory()->create([
        'user_id' => $user->id,
        'score' => 80,
        'status' => 'submitted',
    ]);

    DiagnosticScenarioAttempt::factory()->create([
        'user_id' => $user->id,
        'score' => 60,
        'status' => 'submitted',
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->diagnosticPerformance)
        ->toBe(70);
});

it('detects a developing learner from moderate performance', function () {
    $user = User::factory()->create();

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 65,
        'status' => 'submitted',
    ]);

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 70,
        'status' => 'submitted',
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->level)
        ->toBe(MentorLearningLevel::DEVELOPING);
});

it('detects an intermediate learner from strong performance', function () {
    $user = User::factory()->create();

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 82,
        'status' => 'submitted',
    ]);

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 86,
        'status' => 'submitted',
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->level)
        ->toBe(MentorLearningLevel::INTERMEDIATE);
});

it('detects an advanced learner from consistently excellent performance', function () {
    $user = User::factory()->create();

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 95,
        'status' => 'submitted',
    ]);

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'percentage' => 92,
        'status' => 'submitted',
    ]);

    DiagnosticScenarioAttempt::factory()->create([
        'user_id' => $user->id,
        'score' => 94,
        'status' => 'submitted',
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->level)
        ->toBe(MentorLearningLevel::ADVANCED);
});

it('can build a profile for a specific course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 75,
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build(
            $user,
            (string) $course->id,
        );

    expect($profile->courseId)
        ->toBe((string) $course->id);

    expect($profile->courseProgress)
        ->toBe(75);
});

it('does not include unrelated course progress in a course profile', function () {
    $user = User::factory()->create();

    $courseA = Course::factory()->create();
    $courseB = Course::factory()->create();

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $courseA->id,
        'progress_percentage' => 80,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $courseB->id,
        'progress_percentage' => 20,
    ]);

    $profile = app(MentorStudentProfileService::class)
        ->build(
            $user,
            (string) $courseA->id,
        );

    expect($profile->courseProgress)
        ->toBe(80);
});

it('serializes the student profile', function () {
    $user = User::factory()->create();

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    expect($profile->toArray())
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