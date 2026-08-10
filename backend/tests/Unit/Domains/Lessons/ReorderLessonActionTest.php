<?php

use App\Domains\Lessons\Actions\ReorderLessonAction;
use App\Models\Lesson;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Course;
use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

it('rejects a position beyond the number of lessons', function () {
    $section = Section::factory()->create();

    $lessons = Lesson::factory()
        ->count(3)
        ->for($section)
        ->sequence(
            ['position' => 1],
            ['position' => 2],
            ['position' => 3],
        )
        ->create();

    $action = app(ReorderLessonAction::class);

    expect(fn () => $action->execute(
        $lessons[0],
        4
    ))->toThrow(
        DomainException::class,
        'Lesson position must be within the section lesson range.'
    );
});

it('rejects a lesson reorder beyond the section lesson count', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()
        ->for($instructor, 'instructor')
        ->create();

    $section = Section::factory()
        ->for($course)
        ->create();

    $lesson = Lesson::factory()
        ->for($section)
        ->create([
            'position' => 1,
        ]);

    Lesson::factory()
        ->for($section)
        ->create(['position' => 2]);

    Lesson::factory()
        ->for($section)
        ->create(['position' => 3]);

    actingAs($instructor)
    ->postJson(
        "/api/v1/lessons/{$lesson->id}/reorder",
        ['position' => 4]
    )
        ->assertStatus(422);
});

it('moves a lesson upward', function () {
    $section = Section::factory()->create();

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    $lesson3 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 3,
    ]);

    $action = app(ReorderLessonAction::class);

    $action->execute(
        $lesson3,
        1
    );

    expect($lesson3->fresh()->position)
        ->toBe(1);

    expect($lesson1->fresh()->position)
        ->toBe(2);

    expect($lesson2->fresh()->position)
        ->toBe(3);
});

it('moves a lesson downward', function () {
    $section = Section::factory()->create();

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    $lesson3 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 3,
    ]);

    $action = app(ReorderLessonAction::class);

    $action->execute(
        $lesson1,
        3
    );

    expect($lesson1->fresh()->position)
        ->toBe(3);

    expect($lesson2->fresh()->position)
        ->toBe(1);

    expect($lesson3->fresh()->position)
        ->toBe(2);
});

it('does nothing when position is unchanged', function () {
    $section = Section::factory()->create();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    $action = app(ReorderLessonAction::class);

    $result = $action->execute(
        $lesson,
        2
    );

    expect($result->position)
        ->toBe(2);
});

it('rejects position zero', function () {
    $lesson = Lesson::factory()->create([
        'position' => 1,
    ]);

    $action = app(ReorderLessonAction::class);

    expect(fn () =>
        $action->execute(
            $lesson,
            0
        )
    )->toThrow(DomainException::class);
});

it('rejects a negative position', function () {
    $lesson = Lesson::factory()->create([
        'position' => 1,
    ]);

    $action = app(ReorderLessonAction::class);

    expect(fn () =>
        $action->execute(
            $lesson,
            -1
        )
    )->toThrow(DomainException::class);
});

it('does not affect lessons in another section', function () {
    $sectionA = Section::factory()->create();
    $sectionB = Section::factory()->create();

    $lessonA1 = Lesson::factory()->create([
        'section_id' => $sectionA->id,
        'position' => 1,
    ]);

    $lessonA2 = Lesson::factory()->create([
        'section_id' => $sectionA->id,
        'position' => 2,
    ]);

    $lessonB1 = Lesson::factory()->create([
        'section_id' => $sectionB->id,
        'position' => 1,
    ]);

    $action = app(ReorderLessonAction::class);

    $action->execute(
        $lessonA2,
        1
    );

    expect($lessonB1->fresh()->position)
        ->toBe(1);

    expect($lessonA2->fresh()->position)
        ->toBe(1);

    expect($lessonA1->fresh()->position)
        ->toBe(2);
});