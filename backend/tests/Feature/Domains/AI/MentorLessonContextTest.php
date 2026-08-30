<?php

namespace Tests\Feature\Domains\AI;

use App\Domains\AI\DTOs\MentorLessonContext;
use PHPUnit\Framework\TestCase;

final class MentorLessonContextTest extends TestCase
{
    public function test_it_creates_lesson_context(): void
    {
        $context = new MentorLessonContext(
            lessonId: 'lesson-1',
            courseId: 'course-1',
            sectionId: 'section-1',
            title: 'Introduction to Engine Management',
        );

        $this->assertSame(
            'lesson-1',
            $context->lessonId
        );

        $this->assertSame(
            'course-1',
            $context->courseId
        );

        $this->assertSame(
            'section-1',
            $context->sectionId
        );

        $this->assertSame(
            'Introduction to Engine Management',
            $context->title
        );
    }

    public function test_it_supports_lesson_metadata(): void
    {
        $context = new MentorLessonContext(
            lessonId: 'lesson-1',
            courseId: 'course-1',
            sectionId: 'section-1',
            title: 'Fuel Injection',
            description: 'Understanding fuel injection systems.',
            content: 'Fuel injection controls the amount of fuel delivered.',
            position: 4,
            durationMinutes: 25,
            isPreview: false,
            status: 'published',
        );

        $this->assertSame(
            'Understanding fuel injection systems.',
            $context->description
        );

        $this->assertSame(
            'Fuel injection controls the amount of fuel delivered.',
            $context->content
        );

        $this->assertSame(
            4,
            $context->position
        );

        $this->assertSame(
            25,
            $context->durationMinutes
        );

        $this->assertFalse(
            $context->isPreview
        );

        $this->assertSame(
            'published',
            $context->status
        );
    }

    public function test_it_supports_progress_information(): void
    {
        $context = new MentorLessonContext(
            lessonId: 'lesson-1',
            courseId: 'course-1',
            sectionId: 'section-1',
            title: 'Fuel Injection',
            progressPercentage: 72,
            timeSpent: 840,
            completed: false,
        );

        $this->assertSame(
            72,
            $context->progressPercentage
        );

        $this->assertSame(
            840,
            $context->timeSpent
        );

        $this->assertFalse(
            $context->completed
        );
    }

    public function test_it_supports_completed_lessons(): void
    {
        $context = new MentorLessonContext(
            lessonId: 'lesson-1',
            courseId: 'course-1',
            sectionId: 'section-1',
            title: 'Completed Lesson',
            progressPercentage: 100,
            completed: true,
        );

        $this->assertSame(
            100,
            $context->progressPercentage
        );

        $this->assertTrue(
            $context->completed
        );
    }

    public function test_it_serializes_to_array(): void
    {
        $context = new MentorLessonContext(
            lessonId: 'lesson-1',
            courseId: 'course-1',
            sectionId: 'section-1',
            title: 'Fuel Injection',
            description: 'Lesson description',
            content: 'Lesson content',
            position: 2,
            durationMinutes: 30,
            isPreview: true,
            status: 'published',
            progressPercentage: 50,
            timeSpent: 600,
            completed: false,
        );

        $this->assertSame(
            [
                'lesson_id' => 'lesson-1',
                'course_id' => 'course-1',
                'section_id' => 'section-1',
                'title' => 'Fuel Injection',
                'description' => 'Lesson description',
                'content' => 'Lesson content',
                'position' => 2,
                'duration_minutes' => 30,
                'is_preview' => true,
                'status' => 'published',
                'progress_percentage' => 50,
                'time_spent' => 600,
                'completed' => false,
            ],
            $context->toArray()
        );
    }

    public function test_it_uses_safe_defaults(): void
    {
        $context = new MentorLessonContext(
            lessonId: 'lesson-1',
            courseId: 'course-1',
            sectionId: 'section-1',
            title: 'Lesson',
        );

        $this->assertNull(
            $context->description
        );

        $this->assertNull(
            $context->content
        );

        $this->assertSame(
            0,
            $context->position
        );

        $this->assertSame(
            0,
            $context->durationMinutes
        );

        $this->assertFalse(
            $context->isPreview
        );

        $this->assertSame(
            'draft',
            $context->status
        );

        $this->assertSame(
            0,
            $context->progressPercentage
        );

        $this->assertSame(
            0,
            $context->timeSpent
        );

        $this->assertFalse(
            $context->completed
        );
    }
}