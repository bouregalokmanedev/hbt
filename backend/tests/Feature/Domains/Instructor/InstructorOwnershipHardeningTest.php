<?php

use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function hardenedInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor ownership hardening', function () {
    it('forbids every course lifecycle mutation for a course owned by another instructor', function () {
        $owner = hardenedInstructor();
        $intruder = hardenedInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);

        $this->actingAs($intruder)->deleteJson("/api/v1/instructor/courses/{$course->id}")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/courses/{$course->id}/publish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/courses/{$course->id}/unpublish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/courses/{$course->id}/submit-review")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/courses/{$course->id}/archive")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/courses/{$course->id}/restore")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/courses/{$course->id}/sections", [
            'title' => 'Attempted section',
            'slug' => 'attempted-section',
        ])->assertForbidden();
    });

    it('forbids every section and lesson mutation outside the instructor ownership chain', function () {
        $owner = hardenedInstructor();
        $intruder = hardenedInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $section = Section::factory()->create(['course_id' => $course->id]);
        $lesson = Lesson::factory()->create(['section_id' => $section->id]);

        $this->actingAs($intruder)->patchJson("/api/v1/instructor/sections/{$section->id}", ['title' => 'Attempted'])->assertForbidden();
        $this->actingAs($intruder)->deleteJson("/api/v1/instructor/sections/{$section->id}")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/sections/{$section->id}/publish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/sections/{$section->id}/unpublish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/sections/{$section->id}/reorder", ['position' => 1])->assertForbidden();
        $this->actingAs($intruder)->patchJson("/api/v1/instructor/lessons/{$lesson->id}", ['title' => 'Attempted'])->assertForbidden();
        $this->actingAs($intruder)->deleteJson("/api/v1/instructor/lessons/{$lesson->id}")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/lessons/{$lesson->id}/publish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/lessons/{$lesson->id}/unpublish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/lessons/{$lesson->id}/reorder", ['position' => 1])->assertForbidden();
    });

    it('forbids every quiz, question, and option mutation outside the instructor ownership chain', function () {
        $owner = hardenedInstructor();
        $intruder = hardenedInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $section = Section::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->create(['section_id' => $section->id]);
        $question = QuizQuestion::factory()->create(['quiz_id' => $quiz->id]);
        $option = QuizQuestionOption::factory()->create(['quiz_question_id' => $question->id]);

        $this->actingAs($intruder)->postJson("/api/v1/instructor/courses/{$course->id}/quizzes", [
            'section_id' => $section->id,
            'title' => 'Attempted quiz',
        ])->assertForbidden();
        $this->actingAs($intruder)->patchJson("/api/v1/instructor/quizzes/{$quiz->id}", ['title' => 'Attempted'])->assertForbidden();
        $this->actingAs($intruder)->deleteJson("/api/v1/instructor/quizzes/{$quiz->id}")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/quizzes/{$quiz->id}/publish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/quizzes/{$quiz->id}/unpublish")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/quizzes/{$quiz->id}/questions", [
            'question' => 'Attempted question',
            'type' => 'single_choice',
        ])->assertForbidden();
        $this->actingAs($intruder)->deleteJson("/api/v1/instructor/quiz-questions/{$question->id}")->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/v1/instructor/quiz-questions/{$question->id}/options", ['option' => 'Attempted'])->assertForbidden();
        $this->actingAs($intruder)->deleteJson("/api/v1/instructor/quiz-options/{$option->id}")->assertForbidden();
    });
});
