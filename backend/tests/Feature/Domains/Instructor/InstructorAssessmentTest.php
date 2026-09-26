<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\Competency;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\Course;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

it('instructor can create assessment with mode and interaction types', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    $response = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/courses/{$course->id}/assessments", [
            'title' => 'Final Exam',
            'description' => 'Course final assessment',
            'minimum_score' => 80,
            'assessment_mode' => 'summative',
            'interaction_types' => ['knowledge', 'scenario'],
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.title', 'Final Exam')
        ->assertJsonPath('data.assessment_mode', 'summative')
        ->assertJsonPath('data.interaction_types', ['knowledge', 'scenario']);
});

it('instructor can update assessment', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'title' => 'Original Title',
        'assessment_mode' => 'formative',
    ]);

    $response = $this->actingAs($instructor)
        ->patchJson("/api/v1/instructor/courses/{$course->id}/assessments/{$assessment->id}", [
            'title' => 'Updated Title',
            'assessment_mode' => 'summative',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.title', 'Updated Title')
        ->assertJsonPath('data.assessment_mode', 'summative');
});

it('instructor can publish/unpublish assessment', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'draft',
    ]);

    // Add a question first (required for publish)
    $question = QuizQuestion::factory()->create();
    $assessment->questions()->attach($question->id, ['position' => 1, 'points' => 10]);

    $publishResponse = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/courses/{$course->id}/assessments/{$assessment->id}/publish");

    $publishResponse->assertOk()
        ->assertJsonPath('data.status', 'published');

    $unpublishResponse = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/courses/{$course->id}/assessments/{$assessment->id}/unpublish");

    $unpublishResponse->assertOk()
        ->assertJsonPath('data.status', 'draft');
});

it('instructor can sync competencies', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    $assessment = Assessment::factory()->create(['course_id' => $course->id]);
    $comp1 = Competency::factory()->create(['code' => 'COMP1', 'name' => 'Competency 1']);
    $comp2 = Competency::factory()->create(['code' => 'COMP2', 'name' => 'Competency 2']);

    $response = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/courses/{$course->id}/assessments/{$assessment->id}/competencies", [
            'competencies' => [
                ['competency_id' => $comp1->id, 'position' => 1, 'weight' => 1.5],
                ['competency_id' => $comp2->id, 'position' => 2, 'weight' => 1.0],
            ],
        ]);

    $response->assertOk()
        ->assertJsonCount(2, 'data.competencies');
});

it('instructor can sync questions with competency mapping', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    $section = Section::factory()->create(['course_id' => $course->id]);
    $quiz = Quiz::factory()->create(['section_id' => $section->id, 'status' => 'published']);

    $q1 = QuizQuestion::factory()->create(['quiz_id' => $quiz->id, 'position' => 1]);
    $q2 = QuizQuestion::factory()->create(['quiz_id' => $quiz->id, 'position' => 2]);

    $comp1 = Competency::factory()->create(['code' => 'COMP1', 'name' => 'Competency 1']);
    $comp2 = Competency::factory()->create(['code' => 'COMP2', 'name' => 'Competency 2']);

    $assessment = Assessment::factory()->create(['course_id' => $course->id]);

    $response = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/courses/{$course->id}/assessments/{$assessment->id}/questions", [
            'questions' => [
                ['quiz_question_id' => $q1->id, 'position' => 1, 'points' => 10, 'competency_id' => $comp1->id],
                ['quiz_question_id' => $q2->id, 'position' => 2, 'points' => 15, 'competency_id' => $comp2->id],
            ],
        ]);

    $response->assertOk()
        ->assertJsonCount(2, 'data.questions');
});

it('instructor can get available questions for course', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    $section = Section::factory()->create(['course_id' => $course->id]);
    $quiz = Quiz::factory()->create(['section_id' => $section->id, 'status' => 'published']);
    $question = QuizQuestion::factory()->create(['quiz_id' => $quiz->id]);

    $response = $this->actingAs($instructor)
        ->getJson("/api/v1/instructor/courses/{$course->id}/assessments/questions/available");

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('instructor can get available competencies', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    Competency::factory()->count(3)->create();

    $response = $this->actingAs($instructor)
        ->getJson("/api/v1/instructor/courses/{$course->id}/assessments/competencies/available");

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('non-instructor cannot access assessment endpoints', function () {
    $student = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($student)
        ->getJson("/api/v1/instructor/courses/{$course->id}/assessments")
        ->assertForbidden();
});

it('instructor cannot access other instructor assessments', function () {
    $instructor1 = User::factory()->create();
    $instructor1->assignRole('Instructor');
    $instructor2 = User::factory()->create();
    $instructor2->assignRole('Instructor');

    $course = Course::factory()->create(['instructor_id' => $instructor1->id]);
    $assessment = Assessment::factory()->create(['course_id' => $course->id]);

    $this->actingAs($instructor2)
        ->getJson("/api/v1/instructor/courses/{$course->id}/assessments/{$assessment->id}")
        ->assertForbidden(); // 403 is correct - user doesn't own the course
});