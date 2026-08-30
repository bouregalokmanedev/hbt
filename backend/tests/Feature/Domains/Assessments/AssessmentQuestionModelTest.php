<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Models\Course;

it('belongs to an assessment', function () {
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $question = QuizQuestion::factory()->create();

    $assessmentQuestion = AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
    ]);

    expect($assessmentQuestion->assessment)
        ->toBeInstanceOf(Assessment::class)
        ->and($assessmentQuestion->assessment->id)
        ->toBe($assessment->id);
});

it('belongs to a quiz question', function () {
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $question = QuizQuestion::factory()->create();

    $assessmentQuestion = AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
    ]);

    expect($assessmentQuestion->question)
        ->toBeInstanceOf(QuizQuestion::class)
        ->and($assessmentQuestion->question->id)
        ->toBe($question->id);
});

it('returns assessment questions in position order', function () {
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $first = QuizQuestion::factory()->create();
    $second = QuizQuestion::factory()->create();
    $third = QuizQuestion::factory()->create();

    $assessment->questions()->attach($third->id, [
        'position' => 3,
        'points' => 2,
    ]);

    $assessment->questions()->attach($first->id, [
        'position' => 1,
        'points' => 1,
    ]);

    $assessment->questions()->attach($second->id, [
        'position' => 2,
        'points' => 1,
    ]);

    expect($assessment->questions->pluck('id')->all())
        ->toBe([
            $first->id,
            $second->id,
            $third->id,
        ]);
});

it('stores question points on the assessment pivot', function () {
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $question = QuizQuestion::factory()->create();

    $assessment->questions()->attach($question->id, [
        'position' => 1,
        'points' => 5,
    ]);

    $attachedQuestion = $assessment->questions()->first();

    expect($attachedQuestion->pivot->points)
        ->toBe(5)
        ->and($attachedQuestion->pivot->position)
        ->toBe(1);
});

it('returns assessments from a quiz question', function () {
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $question = QuizQuestion::factory()->create();

    $assessment->questions()->attach($question->id, [
        'position' => 1,
        'points' => 1,
    ]);

    expect($question->assessments)
        ->toHaveCount(1)
        ->and($question->assessments->first()->id)
        ->toBe($assessment->id);
});