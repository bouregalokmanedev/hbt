<?php

namespace Tests\Feature\Domains\Media;

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\LessonStatus;
use App\Enums\MediaType;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Media;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

final class MediaStreamAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $instructor;

    private Course $course;

    private Lesson $lesson;

    private Media $media;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::disk('public')->put('lessons/engine.mp4', 'video-bytes');

        $this->instructor = User::factory()->create();

        $this->course = Course::factory()->create([
            'instructor_id' => $this->instructor->id,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $section = Section::factory()->create([
            'course_id' => $this->course->id,
            'status' => SectionStatus::PUBLISHED,
        ]);

        $this->lesson = Lesson::factory()->create([
            'section_id' => $section->id,
            'status' => LessonStatus::PUBLISHED,
            'is_preview' => false,
            'position' => 1,
        ]);

        $this->media = Media::factory()->create([
            'uploaded_by' => $this->instructor->id,
            'disk' => 'public',
            'path' => 'lessons/engine.mp4',
            'filename' => 'engine.mp4',
            'original_name' => 'engine.mp4',
            'mime_type' => 'video/mp4',
            'extension' => 'mp4',
            'size' => 11,
            'type' => MediaType::VIDEO,
            'mediable_type' => Lesson::class,
            'mediable_id' => $this->lesson->id,
        ]);
    }

    private function enrol(User $user, string $status = 'active'): Enrollment
    {
        return Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $this->course->id,
            'status' => $status,
        ]);
    }

    public function test_guest_must_use_a_signed_url_or_authenticate(): void
    {
        $this->getJson($this->streamUrl())->assertUnauthorized();
    }

    public function test_unenrolled_learner_cannot_stream_paid_lesson_media(): void
    {
        $learner = User::factory()->create();

        $this
            ->actingAs($learner)
            ->get($this->streamUrl())
            ->assertForbidden();
    }

    public function test_enrolled_learner_can_stream_lesson_media(): void
    {
        $learner = User::factory()->create();
        $this->enrol($learner);

        $this
            ->actingAs($learner)
            ->get($this->streamUrl())
            ->assertOk();
    }

    public function test_draft_lesson_media_is_hidden_even_from_enrolled_learners(): void
    {
        $learner = User::factory()->create();
        $this->enrol($learner);

        $this->lesson->update(['status' => LessonStatus::DRAFT]);

        $this
            ->actingAs($learner)
            ->get($this->streamUrl())
            ->assertForbidden();
    }

    public function test_media_from_a_draft_course_is_hidden_from_enrolled_learners(): void
    {
        $learner = User::factory()->create();
        $this->enrol($learner);

        $this->course->update(['status' => CourseStatus::DRAFT]);

        $this
            ->actingAs($learner)
            ->get($this->streamUrl())
            ->assertForbidden();
    }

    public function test_course_owner_can_stream_their_lesson_media(): void
    {
        $this
            ->actingAs($this->instructor)
            ->get($this->streamUrl())
            ->assertOk();
    }

    public function test_admin_can_stream_any_lesson_media(): void
    {
        Role::findOrCreate('Admin', 'web');

        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $this
            ->actingAs($admin)
            ->get($this->streamUrl())
            ->assertOk();
    }

    public function test_preview_lessons_are_streamable_by_authenticated_guests(): void
    {
        $this->lesson->update(['is_preview' => true]);

        $this
            ->actingAs(User::factory()->create())
            ->get($this->streamUrl())
            ->assertOk();
    }

    public function test_a_valid_signed_url_streams_without_a_bearer_token(): void
    {
        $url = URL::temporarySignedRoute(
            'media.stream',
            now()->addMinutes(5),
            ['media' => $this->media->id],
        );

        $this->get($url)->assertOk();
    }

    public function test_signed_media_can_be_embedded_from_another_origin(): void
    {
        $url = URL::temporarySignedRoute(
            'media.stream',
            now()->addMinutes(5),
            ['media' => $this->media->id],
        );

        $this
            ->get($url)
            ->assertOk()
            ->assertHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }

    public function test_json_api_responses_keep_same_site_resource_policy(): void
    {
        $this
            ->getJson('/api/v1/catalog/courses')
            ->assertHeader('Cross-Origin-Resource-Policy', 'same-site');
    }

    public function test_an_expired_signed_url_is_rejected(): void
    {
        $url = URL::temporarySignedRoute(
            'media.stream',
            now()->subMinute(),
            ['media' => $this->media->id],
        );

        $this->getJson($url)->assertUnauthorized();
    }

    private function streamUrl(): string
    {
        return "/api/v1/media/{$this->media->id}/stream";
    }
}
