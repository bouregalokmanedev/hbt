<?php

use App\Domains\Courses\Services\SectionProgressService;
use App\Domains\Courses\Events\SectionProgressUpdated;
use App\Models\CourseProgress;
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

it('syncs course progress when section progress is updated', function () {
    SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->section->id,
        'progress_percentage' => 50,
        'time_spent' => 300,
    ]);

    $sectionProgress = SectionProgress::query()
        ->where('user_id', $this->user->id)
        ->where('section_id', $this->section->id)
        ->firstOrFail();

    event(new SectionProgressUpdated($sectionProgress));

    $courseProgress = CourseProgress::query()
        ->where('user_id', $this->user->id)
        ->where('course_id', $this->course->id)
        ->first();

    expect($courseProgress)
        ->not->toBeNull()
        ->and($courseProgress->progress_percentage)
        ->toBe(50)
        ->and($courseProgress->time_spent)
        ->toBe(300);
});