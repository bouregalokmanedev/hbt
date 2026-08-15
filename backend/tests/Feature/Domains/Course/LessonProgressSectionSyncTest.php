<?php

use App\Domains\Courses\Services\SectionProgressService;
use App\Domains\Lessons\Events\LessonProgressUpdated;
use App\Models\LessonProgress;
use App\Models\SectionProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Enums\LessonStatus;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Models\Section;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->course = Course::factory()->create();

    $this->section = Section::factory()->create([
        'course_id' => $this->course->id,
    ]);

    $this->lessonOne = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'position' => 1,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $this->lessonTwo = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'position' => 2,
        'status' => LessonStatus::PUBLISHED,
    ]);
});

it('syncs section progress when lesson progress is updated', function () {
    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonOne->id,
        'progress_percentage' => 50,
        'time_spent' => 120,
    ]);

    event(new LessonProgressUpdated($progress));

    $sectionProgress = SectionProgress::query()
        ->where('user_id', $this->user->id)
        ->where('section_id', $this->section->id)
        ->first();

    expect($sectionProgress)
        ->not->toBeNull()
        ->and($sectionProgress->progress_percentage)
        ->toBe(25)
        ->and($sectionProgress->time_spent)
        ->toBe(120);
});