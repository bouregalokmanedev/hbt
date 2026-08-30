<?php

use App\Domains\Quizzes\Enums\QuizStatus;
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

function quizInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor quiz management', function () {
    it('creates a quiz only in a section owned by the instructor', function () {
        $owner = quizInstructor();
        $other = quizInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $section = Section::factory()->create(['course_id' => $course->id]);
        $otherCourse = Course::factory()->create(['instructor_id' => $other->id]);
        $otherSection = Section::factory()->create(['course_id' => $otherCourse->id]);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/courses/{$course->id}/quizzes", [
                'section_id' => $section->id,
                'title' => 'Module checkpoint',
                'slug' => 'module-checkpoint',
                'pass_percentage' => 75,
                'time_limit' => 5,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', QuizStatus::DRAFT->value);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/courses/{$course->id}/quizzes", [
                'section_id' => $otherSection->id,
                'title' => 'Not allowed',
            ])
            ->assertNotFound();
    });

    it('protects every nested quiz resource by course ownership', function () {
        $owner = quizInstructor();
        $other = quizInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $quiz = Quiz::factory()->create([
            'section_id' => Section::factory()->create(['course_id' => $course->id])->id,
        ]);
        $question = QuizQuestion::factory()->create(['quiz_id' => $quiz->id]);
        $option = QuizQuestionOption::factory()->create(['quiz_question_id' => $question->id]);

        $this->actingAs($other)->getJson("/api/v1/instructor/quizzes/{$quiz->id}")->assertForbidden();
        $this->actingAs($other)->patchJson("/api/v1/instructor/quiz-questions/{$question->id}", ['question' => 'Attempted change'])->assertForbidden();
        $this->actingAs($other)->patchJson("/api/v1/instructor/quiz-options/{$option->id}", ['is_correct' => true])->assertForbidden();
    });

    it('manages questions and options then publishes a valid quiz', function () {
        $owner = quizInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $section = Section::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->create(['section_id' => $section->id]);

        $question = $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/quizzes/{$quiz->id}/questions", [
                'question' => 'Which signal carries CAN high?',
                'type' => 'single_choice',
                'points' => 2,
            ]);

        $question->assertCreated();
        $questionId = $question->json('id');

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/quiz-questions/{$questionId}/options", [
                'option' => 'The dominant high bus signal',
                'is_correct' => true,
            ])
            ->assertCreated();

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/quizzes/{$quiz->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', QuizStatus::PUBLISHED->value);
    });
});
