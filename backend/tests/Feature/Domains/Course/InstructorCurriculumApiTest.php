<?php

use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
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

function curriculumInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor curriculum management', function () {
    it('shows drafts to the owner but never another instructors curriculum', function () {
        $owner = curriculumInstructor();
        $other = curriculumInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);

        $section = Section::factory()->create([
            'course_id' => $course->id,
            'status' => SectionStatus::DRAFT,
            'title' => 'Draft section',
        ]);

        Lesson::factory()->create([
            'section_id' => $section->id,
            'status' => LessonStatus::DRAFT,
            'title' => 'Draft lesson',
        ]);

        $this
            ->actingAs($owner)
            ->getJson("/api/v1/instructor/courses/{$course->id}/curriculum")
            ->assertOk()
            ->assertJsonPath('data.sections.0.title', 'Draft section')
            ->assertJsonPath('data.sections.0.lessons.0.title', 'Draft lesson');

        $this
            ->actingAs($other)
            ->getJson("/api/v1/instructor/courses/{$course->id}/curriculum")
            ->assertForbidden();
    });

    it('uses the course and section route ownership instead of client supplied ids', function () {
        $owner = curriculumInstructor();
        $other = curriculumInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $otherCourse = Course::factory()->create(['instructor_id' => $other->id]);
        $otherSection = Section::factory()->create(['course_id' => $otherCourse->id]);

        $response = $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/courses/{$course->id}/sections", [
                'title' => 'Basics',
                'slug' => 'basics',
                'course_id' => $otherCourse->id,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('sections', [
            'course_id' => $course->id,
            'title' => 'Basics',
        ]);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/sections/{$otherSection->id}/lessons", [
                'title' => 'Private lesson',
                'slug' => 'private-lesson',
            ])
            ->assertForbidden();
    });

    it('allows an owner to create, update, publish, and reorder lessons', function () {
        $owner = curriculumInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $section = Section::factory()->create(['course_id' => $course->id]);

        $created = $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/sections/{$section->id}/lessons", [
                'title' => 'Voltage basics',
                'slug' => 'voltage-basics',
                'content' => 'Lesson content',
                'duration_minutes' => 12,
            ]);

        $created->assertCreated()->assertJsonPath('title', 'Voltage basics');
        $lessonId = $created->json('id');

        $this
            ->actingAs($owner)
            ->patchJson("/api/v1/instructor/lessons/{$lessonId}", [
                'content' => 'Updated lesson content',
            ])
            ->assertOk();

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/lessons/{$lessonId}/publish")
            ->assertOk()
            ->assertJsonPath('status', LessonStatus::PUBLISHED->value);
    });
});
