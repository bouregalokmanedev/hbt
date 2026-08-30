<?php

use App\Domains\AI\DTOs\MentorStudentProfile;
use App\Domains\AI\Enums\MentorLearningLevel;

it('stores the student learning profile', function () {
    $profile = new MentorStudentProfile(
        level: MentorLearningLevel::INTERMEDIATE,
        coursesEnrolled: 3,
        coursesCompleted: 1,
        averageQuizScore: 82.5,
        averageAssessmentScore: 78.0,
        averageDiagnosticScore: 84.5,
        lessonsCompleted: 24,
        lessonsInProgress: 2,
        weakAreas: [
            'fuel_trim',
            'oxygen_sensor_diagnostics',
        ],
        strongAreas: [
            'engine_sensors',
            'basic_diagnostics',
        ],
        recentFailures: [
            'fuel_trim_quiz',
        ],
        recentSuccesses: [
            'maf_sensor_diagnostic',
        ],
    );

    expect($profile->level)
        ->toBe(MentorLearningLevel::INTERMEDIATE);

    expect($profile->coursesEnrolled)
        ->toBe(3);

    expect($profile->coursesCompleted)
        ->toBe(1);

    expect($profile->averageQuizScore)
        ->toBe(82.5);

    expect($profile->averageAssessmentScore)
        ->toBe(78.0);

    expect($profile->averageDiagnosticScore)
        ->toBe(84.5);

    expect($profile->lessonsCompleted)
        ->toBe(24);

    expect($profile->lessonsInProgress)
        ->toBe(2);
});

it('serializes the profile', function () {
    $profile = new MentorStudentProfile(
        userId: 'user-123',
        courseId: 'course-123',
        level: MentorLearningLevel::BEGINNER,
        overallProgress: 40,
        courseProgress: 50,
        lessonProgress: 30,
        quizPerformance: 40,
        assessmentPerformance: 0,
        diagnosticPerformance: 0,
        coursesStarted: 1,
        coursesCompleted: 0,
    );

    expect($profile->toArray())
        ->toBe([
            'user_id' => 'user-123',
            'course_id' => 'course-123',
            'learning_level' => 'beginner',
            'overall_progress' => 40,
            'course_progress' => 50,
            'lesson_progress' => 30,
            'quiz_performance' => 40,
            'assessment_performance' => 0,
            'diagnostic_performance' => 0,
            'courses_started' => 1,
            'courses_completed' => 0,

            'courses_enrolled' => 0,
            'average_quiz_score' => 0.0,
            'average_assessment_score' => 0.0,
            'average_diagnostic_score' => 0.0,
            'lessons_completed' => 0,
            'lessons_in_progress' => 0,

            'weak_areas' => [],
            'strong_areas' => [],
            'recent_failures' => [],
            'recent_successes' => [],
        ]);
});

it('serializes the learning level using its value', function () {
    $profile = new MentorStudentProfile(
        level: MentorLearningLevel::ADVANCED,
        coursesEnrolled: 5,
        coursesCompleted: 4,
        averageQuizScore: 94.0,
        averageAssessmentScore: 92.0,
        averageDiagnosticScore: 91.0,
        lessonsCompleted: 80,
        lessonsInProgress: 1,
    );

    expect($profile->toArray()['learning_level'])
        ->toBe('advanced');
});

it('defaults learning signals to empty arrays', function () {
    $profile = new MentorStudentProfile(
        level: MentorLearningLevel::BEGINNER,
        coursesEnrolled: 0,
        coursesCompleted: 0,
        averageQuizScore: 0.0,
        averageAssessmentScore: 0.0,
        averageDiagnosticScore: 0.0,
        lessonsCompleted: 0,
        lessonsInProgress: 0,
    );

    expect($profile->weakAreas)->toBe([])
        ->and($profile->strongAreas)->toBe([])
        ->and($profile->recentFailures)->toBe([])
        ->and($profile->recentSuccesses)->toBe([]);
});