<?php

use App\Domains\Assignments\Models\Assignment;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function enrolledAssignmentLearner(): array
{
    $student = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published']);
    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    return [$student, $course];
}

describe('Learner assignments', function () {
    it('lists only published assignments for enrolled courses', function () {
        [$student, $course] = enrolledAssignmentLearner();
        $otherCourse = Course::factory()->create(['status' => 'published']);

        Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'title' => 'Published homework',
        ]);
        Assignment::factory()->create([
            'course_id' => $course->id,
            'title' => 'Draft homework',
        ]);
        Assignment::factory()->published()->create([
            'course_id' => $otherCourse->id,
            'title' => 'Other course homework',
        ]);

        $this
            ->actingAs($student)
            ->getJson("/api/v1/courses/{$course->id}/assignments")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Published homework');

        $this
            ->actingAs($student)
            ->getJson('/api/v1/assignments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.course_title', $course->title);
    });

    it('forbids learners who are not enrolled', function () {
        $outsider = User::factory()->create();
        $course = Course::factory()->create(['status' => 'published']);
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
        ]);

        $this
            ->actingAs($outsider)
            ->getJson("/api/v1/courses/{$course->id}/assignments")
            ->assertForbidden();

        $this
            ->actingAs($outsider)
            ->getJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}")
            ->assertForbidden();

        $this
            ->actingAs($outsider)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [
                'content' => 'Not enrolled.',
            ])
            ->assertForbidden();
    });

    it('hides draft assignments from enrolled learners', function () {
        [$student, $course] = enrolledAssignmentLearner();
        $assignment = Assignment::factory()->create([
            'course_id' => $course->id,
        ]);

        $this
            ->actingAs($student)
            ->getJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}")
            ->assertNotFound();
    });

    it('creates and updates a submission until it is graded', function () {
        [$student, $course] = enrolledAssignmentLearner();
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'max_points' => 100,
        ]);

        $this
            ->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [
                'content' => 'First attempt: battery measured at 12.4 V.',
                'link_url' => 'https://example.com/evidence',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.content', 'First attempt: battery measured at 12.4 V.');

        $this
            ->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [
                'content' => 'Revised: battery measured at 12.6 V after charging.',
            ])
            ->assertOk()
            ->assertJsonPath('data.content', 'Revised: battery measured at 12.6 V after charging.')
            ->assertJsonPath('data.link_url', null);

        expect(
            AssignmentSubmission::query()
                ->where('assignment_id', $assignment->id)
                ->where('user_id', $student->id)
                ->count(),
        )->toBe(1);

        AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->where('user_id', $student->id)
            ->firstOrFail()
            ->forceFill([
                'status' => 'graded',
                'grade' => 90,
                'graded_at' => now(),
            ])
            ->save();

        $this
            ->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [
                'content' => 'A third attempt.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('submission');
    });

    it('returns the learner grade and feedback after grading', function () {
        [$student, $course] = enrolledAssignmentLearner();
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'max_points' => 100,
        ]);
        AssignmentSubmission::factory()->graded()->create([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
            'grade' => 86,
            'feedback' => 'Good use of the service manual.',
        ]);

        $this
            ->actingAs($student)
            ->getJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}")
            ->assertOk()
            ->assertJsonPath('data.submission.status', 'graded')
            ->assertJsonPath('data.submission.grade', 86)
            ->assertJsonPath('data.submission.feedback', 'Good use of the service manual.');
    });

    it('blocks late submissions when the instructor disallows them', function () {
        [$student, $course] = enrolledAssignmentLearner();
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'due_at' => now()->subDay(),
            'allow_late_submissions' => false,
        ]);

        $this
            ->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [
                'content' => 'Late work.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('assignment');
    });

    it('accepts late submissions when the instructor allows them', function () {
        [$student, $course] = enrolledAssignmentLearner();
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'due_at' => now()->subDay(),
            'allow_late_submissions' => true,
        ]);

        $this
            ->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [
                'content' => 'Late work with permission.',
            ])
            ->assertOk()
            ->assertJsonPath('data.is_late', true);
    });

    it('requires a response or a link and only accepts http links', function () {
        [$student, $course] = enrolledAssignmentLearner();
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
        ]);

        $this
            ->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('content');

        $this
            ->actingAs($student)
            ->postJson("/api/v1/courses/{$course->id}/assignments/{$assignment->id}/submission", [
                'link_url' => 'javascript:alert(1)',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('link_url');
    });
});
