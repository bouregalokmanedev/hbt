<?php

use App\Domains\AI\RAG\Contracts\MentorContentRetriever;
use App\Domains\AI\RAG\DTOs\MentorRetrievedChunk;
use App\Domains\AI\RAG\Services\DatabaseMentorContentRetriever;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;

function ragCourse(array $attributes = []): Course
{
    return Course::factory()->create($attributes);
}

function ragSection(Course $course, array $attributes = []): Section
{
    return Section::factory()->create(array_merge([
        'course_id' => $course->id,
    ], $attributes));
}

function ragLesson(Section $section, array $attributes = []): Lesson
{
    $position = $attributes['position']
        ?? (($section->lessons()->max('position') ?? 0) + 1);

    return Lesson::factory()->create(array_merge([
        'section_id' => $section->id,
        'status' => 'published',
        'position' => $position,
    ], $attributes));
}

function ragRetriever(): DatabaseMentorContentRetriever
{
    return app(DatabaseMentorContentRetriever::class);
}

it('implements the mentor content retriever contract', function () {
    expect(ragRetriever())
        ->toBeInstanceOf(MentorContentRetriever::class);
});

it('retrieves relevant course content', function () {
    $course = ragCourse();

    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Fuel Trim Diagnostics',
        'description' => 'Understanding fuel trim measurements.',
        'content' => 'Positive fuel trim indicates the ECU is adding fuel.',
    ]);

    ragLesson($section, [
        'title' => 'Cooling System',
        'description' => 'Engine cooling fundamentals.',
        'content' => 'The thermostat controls coolant flow.',
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
    );

    expect($results)
        ->toHaveCount(1)
        ->and($results[0])
        ->toBeInstanceOf(MentorRetrievedChunk::class);

    expect($results[0]->content)
        ->toContain('Positive fuel trim');
});

it('searches lesson titles', function () {
    $course = ragCourse();
    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Oscilloscope Ignition Waveforms',
        'content' => 'Basic ignition waveform analysis.',
    ]);

    $results = ragRetriever()->retrieve(
        'oscilloscope ignition',
        $course->id,
    );

    expect($results)->toHaveCount(1);
});

it('searches lesson descriptions', function () {
    $course = ragCourse();
    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Fuel System',
        'description' => 'Diagnosing positive fuel trim conditions.',
        'content' => 'Fuel system diagnostic procedures.',
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
    );

    expect($results)->toHaveCount(1);
});

it('searches lesson content', function () {
    $course = ragCourse();
    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Engine Management',
        'content' => 'A vacuum leak can cause positive fuel trim.',
    ]);

    $results = ragRetriever()->retrieve(
        'vacuum leak positive fuel trim',
        $course->id,
    );

    expect($results)->toHaveCount(1);

    expect($results[0]->content)
        ->toContain('vacuum leak');
});

it('filters results by course', function () {
    $courseA = ragCourse();
    $sectionA = ragSection($courseA);

    ragLesson($sectionA, [
        'title' => 'Fuel Trim A',
        'content' => 'Positive fuel trim diagnosis.',
    ]);

    $courseB = ragCourse();
    $sectionB = ragSection($courseB);

    ragLesson($sectionB, [
        'title' => 'Fuel Trim B',
        'content' => 'Positive fuel trim diagnosis.',
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $courseA->id,
    );

    expect($results)->toHaveCount(1);

    expect($results[0]->metadata['course_id'])
        ->toBe($courseA->id);
});

it('filters results by lesson', function () {
    $course = ragCourse();
    $section = ragSection($course);

    $targetLesson = ragLesson($section, [
        'title' => 'Target Diagnostic Lesson',
        'content' => 'Positive fuel trim diagnostic procedure.',
    ]);

    ragLesson($section, [
        'title' => 'Other Diagnostic Lesson',
        'content' => 'Positive fuel trim diagnostic procedure.',
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
        $targetLesson->id,
    );

    expect($results)->toHaveCount(1);

    expect($results[0]->metadata['lesson_id'])
        ->toBe($targetLesson->id);
});

it('respects the retrieval limit', function () {
    $course = ragCourse();
    $section = ragSection($course);

    for ($i = 1; $i <= 5; $i++) {
        ragLesson($section, [
            'title' => "Fuel Trim Lesson {$i}",
            'content' => 'Positive fuel trim diagnostic procedure.',
            'position' => $i,
        ]);
    }

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
        null,
        2,
    );

    expect($results)->toHaveCount(2);
});

it('returns an empty array when nothing matches', function () {
    $course = ragCourse();
    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Cooling System',
        'content' => 'Thermostat and coolant fundamentals.',
    ]);

    $results = ragRetriever()->retrieve(
        'CAN bus termination resistance',
        $course->id,
    );

    expect($results)->toBe([]);
});

it('does not retrieve content from another course', function () {
    $course = ragCourse();
    $otherCourse = ragCourse();

    $section = ragSection($otherCourse);

    ragLesson($section, [
        'title' => 'Fuel Trim',
        'content' => 'Positive fuel trim diagnosis.',
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
    );

    expect($results)->toBe([]);
});

it('handles case insensitive searches', function () {
    $course = ragCourse();
    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Fuel Trim Diagnostics',
        'content' => 'Positive Fuel Trim indicates additional fuel is required.',
    ]);

    $results = ragRetriever()->retrieve(
        'POSITIVE FUEL TRIM',
        $course->id,
    );

    expect($results)->toHaveCount(1);
});

it('returns safe defaults for optional chunk fields', function () {
    $course = ragCourse();
    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Fuel Trim',
        'description' => null,
        'content' => 'Positive fuel trim diagnosis.',
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
    );

    expect($results)->toHaveCount(1);

    expect($results[0]->title)
        ->toBe('Fuel Trim');

    expect($results[0]->score)
        ->toBeGreaterThanOrEqual(0);
});

it('returns course and lesson metadata', function () {
    $course = ragCourse();
    $section = ragSection($course);

    $lesson = ragLesson($section, [
        'title' => 'Fuel Trim Diagnostics',
        'content' => 'Positive fuel trim diagnosis.',
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
        $lesson->id,
    );

    expect($results)->toHaveCount(1);

    expect($results[0]->metadata)
        ->toMatchArray([
            'course_id' => $course->id,
            'lesson_id' => $lesson->id,
            'section_id' => $section->id,
        ]);
});

it('returns results ordered by relevance', function () {
    $course = ragCourse();
    $section = ragSection($course);

    ragLesson($section, [
        'title' => 'Engine Management',
        'content' => 'Fuel trim fundamentals.',
        'position' => 1,
    ]);

    ragLesson($section, [
        'title' => 'Positive Fuel Trim Diagnostics',
        'content' => 'Positive fuel trim positive fuel trim diagnosis.',
        'position' => 2,
    ]);

    $results = ragRetriever()->retrieve(
        'positive fuel trim',
        $course->id,
    );

    expect($results)->not->toBeEmpty();

    if (count($results) > 1) {
        expect($results[0]->score)
            ->toBeGreaterThanOrEqual($results[1]->score);
    }
});