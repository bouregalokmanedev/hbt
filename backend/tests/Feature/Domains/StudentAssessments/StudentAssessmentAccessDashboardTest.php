<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function accessCourse(User $user, array $courseOverrides = [], string $enrollmentStatus = 'active'): Course
{
    $course = Course::factory()->create(array_merge(['status' => 'published'], $courseOverrides));
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => $enrollmentStatus,
    ]);

    return $course;
}

function accessAssessment(Course $course, array $overrides = []): Assessment
{
    return Assessment::factory()->create(array_merge(
        ['course_id' => $course->id, 'status' => 'published', 'required_quiz_score' => 0, 'required_scenarios' => 0],
        $overrides,
    ));
}

it('denies start without an enrollment', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published']);
    $assessment = accessAssessment($course);

    $this->actingAs($user)
        ->postJson("/api/v1/student/assessments/{$assessment->id}/attempts")
        ->assertForbidden()
        ->assertJsonPath('success', false);
});

it('denies start with a cancelled enrollment', function () {
    $user = User::factory()->create();
    $course = accessCourse($user, [], 'cancelled');
    $assessment = accessAssessment($course);

    $this->actingAs($user)
        ->postJson("/api/v1/student/assessments/{$assessment->id}/attempts")
        ->assertForbidden();
});

it('denies start when the course is not published', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'draft']);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);
    $assessment = accessAssessment($course);

    $this->actingAs($user)
        ->postJson("/api/v1/student/assessments/{$assessment->id}/attempts")
        ->assertForbidden();
});

it('denies legacy start without an enrollment', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published']);
    $assessment = accessAssessment($course);

    $this->actingAs($user)
        ->postJson("/api/v1/assessments/{$assessment->id}/attempts")
        ->assertForbidden();
});

it('returns eligibility evidence with 422 for failing prerequisites', function () {
    $user = User::factory()->create();
    $course = accessCourse($user);
    // Uncompleted lesson blocks eligibility while access passes.
    $section = \App\Models\Section::factory()->create(['course_id' => $course->id]);
    \App\Models\Lesson::factory()->create(['section_id' => $section->id]);
    $assessment = accessAssessment($course);

    $this->actingAs($user)
        ->postJson("/api/v1/student/assessments/{$assessment->id}/attempts")
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['success', 'message', 'evidence']);
});

it('aggregates the student dashboard', function () {
    $user = User::factory()->create();
    $course = accessCourse($user);
    $section = \App\Models\Section::factory()->create(['course_id' => $course->id]);
    $lesson = \App\Models\Lesson::factory()->create(['section_id' => $section->id]);
    $lesson->progressForUser()->create([
        'user_id' => $user->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $assessment = accessAssessment($course, ['minimum_score' => 100]);

    $question = QuizQuestion::factory()->create();
    QuizQuestionOption::factory()->create(['quiz_question_id' => $question->id, 'is_correct' => true, 'position' => 1]);
    $wrong = QuizQuestionOption::factory()->create(['quiz_question_id' => $question->id, 'is_correct' => false, 'position' => 2]);
    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => 1,
        'points' => 10,
    ]);

    // In-progress state
    $start = $this->actingAs($user)->postJson("/api/v1/student/assessments/{$assessment->id}/attempts");
    $start->assertCreated();
    $attemptId = $start->json('data.id');

    $dashboard = $this->actingAs($user)->getJson('/api/v1/student/dashboard');
    $dashboard->assertOk()
        ->assertJsonCount(1, 'data.assessments.in_progress')
        ->assertJsonPath('data.stats.total_attempts', 1);

    // Fail the assessment → weak competency + recommendation
    $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attemptId}/submit",
        ['answers' => [['question_id' => $question->id, 'option_ids' => [$wrong->id]]]],
    )->assertCreated();

    $dashboard = $this->actingAs($user)->getJson('/api/v1/student/dashboard');
    $dashboard->assertOk()
        ->assertJsonCount(0, 'data.assessments.in_progress')
        ->assertJsonCount(1, 'data.assessments.completed')
        ->assertJsonPath('data.stats.passed_results', 0)
        ->assertJsonPath('data.competencies.counts.weak', 1)
        ->assertJsonCount(1, 'data.recommendations');
});
