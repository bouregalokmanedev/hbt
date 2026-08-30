<?php

namespace Tests\Feature\Domains\AI;

use App\Domains\AI\Services\MentorLessonContextService;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class MentorLessonContextServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create a lesson that satisfies the real lesson-access rules.
     */
    private function createAccessibleLesson(
        User $user,
    ): array {
        $course = Course::factory()->create([
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $section = Section::factory()->create([
            'course_id' => $course->id,
            'status' => SectionStatus::PUBLISHED,
        ]);

        $lesson = Lesson::factory()->create([
            'section_id' => $section->id,
            'status' => LessonStatus::PUBLISHED,
            'is_preview' => false,
        ]);

        Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::ACTIVE,
        ]);

        return [
            $course,
            $section,
            $lesson,
        ];
    }

    public function test_it_builds_lesson_context_for_an_enrolled_user(): void
    {
        $user = User::factory()->create();

        [$course, $section, $lesson] = $this->createAccessibleLesson(
            $user,
        );

        $lesson->update([
            'title' => 'Fuel Injection',
            'description' => 'Understanding fuel injection.',
            'content' => 'Fuel injection lesson content.',
            'position' => 3,
            'duration_minutes' => 25,
        ]);

        $context = app(MentorLessonContextService::class)
            ->build($user, $lesson, $course->id);

        $this->assertNotNull($context);

        $this->assertSame(
            (string) $lesson->id,
            $context->lessonId
        );

        $this->assertSame(
            (string) $course->id,
            $context->courseId
        );

        $this->assertSame(
            (string) $section->id,
            $context->sectionId
        );

        $this->assertSame(
            'Fuel Injection',
            $context->title
        );

        $this->assertSame(
            3,
            $context->position
        );
    }

    public function test_it_includes_lesson_progress(): void
    {
        $user = User::factory()->create();

        [$course, , $lesson] = $this->createAccessibleLesson(
            $user,
        );

        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'progress_percentage' => 65,
            'time_spent' => 900,
        ]);

        $context = app(MentorLessonContextService::class)
            ->build($user, $lesson, $course->id);

        $this->assertNotNull($context);

        $this->assertSame(
            65,
            $context->progressPercentage
        );

        $this->assertSame(
            900,
            $context->timeSpent
        );

        $this->assertFalse(
            $context->completed
        );
    }

    public function test_it_detects_completed_lesson(): void
    {
        $user = User::factory()->create();

        [$course, , $lesson] = $this->createAccessibleLesson(
            $user,
        );

        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);

        $context = app(MentorLessonContextService::class)
            ->build($user, $lesson, $course->id);

        $this->assertNotNull($context);

        $this->assertSame(
            100,
            $context->progressPercentage
        );

        $this->assertTrue(
            $context->completed
        );
    }

    public function test_it_returns_null_for_an_unenrolled_user(): void
    {
        $user = User::factory()->create();

        $course = Course::factory()->create([
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $section = Section::factory()->create([
            'course_id' => $course->id,
            'status' => SectionStatus::PUBLISHED,
        ]);

        $lesson = Lesson::factory()->create([
            'section_id' => $section->id,
            'status' => LessonStatus::PUBLISHED,
            'is_preview' => false,
        ]);

        $context = app(MentorLessonContextService::class)
            ->build($user, $lesson, $course->id);

        $this->assertNull($context);
    }

    public function test_it_returns_null_when_course_does_not_match(): void
    {
        $user = User::factory()->create();

        [$course, , $lesson] = $this->createAccessibleLesson(
            $user,
        );

        $otherCourse = Course::factory()->create([
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $context = app(MentorLessonContextService::class)
            ->build($user, $lesson, $otherCourse->id);

        $this->assertNull($context);
    }

    public function test_it_creates_zero_progress_when_progress_does_not_exist(): void
    {
        $user = User::factory()->create();

        [$course, , $lesson] = $this->createAccessibleLesson(
            $user,
        );

        $context = app(MentorLessonContextService::class)
            ->build($user, $lesson, $course->id);

        $this->assertNotNull($context);

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

        $this->assertDatabaseHas(
            'lesson_progress',
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ]
        );
    }

    public function test_it_serializes_lesson_context(): void
    {
        $user = User::factory()->create();

        [$course, $section, $lesson] = $this->createAccessibleLesson(
            $user,
        );

        $context = app(MentorLessonContextService::class)
            ->build($user, $lesson, $course->id);

        $this->assertNotNull($context);

        $data = $context->toArray();

        $this->assertSame(
            (string) $lesson->id,
            $data['lesson_id']
        );

        $this->assertSame(
            (string) $course->id,
            $data['course_id']
        );

        $this->assertSame(
            (string) $section->id,
            $data['section_id']
        );

        $this->assertSame(
            $lesson->title,
            $data['title']
        );
    }
}