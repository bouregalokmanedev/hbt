<?php

use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function assignmentInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor assignment management', function () {
    it('creates and lists assignments for an owned course', function () {
        $owner = assignmentInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/courses/{$course->id}/assignments", [
                'title' => 'Bench test a charging system',
                'instructions' => 'Record the battery voltage at idle and at 2,000 RPM.',
                'due_at' => now()->addDays(3)->toISOString(),
                'max_points' => 50,
                'allow_late_submissions' => false,
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Bench test a charging system')
            ->assertJsonPath('data.status', AssignmentStatus::DRAFT->value)
            ->assertJsonPath('data.max_points', 50)
            ->assertJsonPath('data.allow_late_submissions', false);

        $this
            ->actingAs($owner)
            ->getJson("/api/v1/instructor/courses/{$course->id}/assignments")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'bench-test-a-charging-system');
    });

    it('forbids assignment access outside the instructor ownership chain', function () {
        $owner = assignmentInstructor();
        $intruder = assignmentInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $assignment = Assignment::factory()->create(['course_id' => $course->id]);
        $submission = AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
        ]);

        $this->actingAs($intruder)
            ->getJson("/api/v1/instructor/courses/{$course->id}/assignments")
            ->assertForbidden();

        $this->actingAs($intruder)
            ->postJson("/api/v1/instructor/courses/{$course->id}/assignments", [
                'title' => 'Attempted assignment',
                'instructions' => 'Not allowed.',
            ])
            ->assertForbidden();

        $this->actingAs($intruder)
            ->patchJson("/api/v1/instructor/assignments/{$assignment->id}", [
                'title' => 'Attempted change',
            ])
            ->assertForbidden();

        $this->actingAs($intruder)
            ->postJson("/api/v1/instructor/assignments/{$assignment->id}/publish")
            ->assertForbidden();

        $this->actingAs($intruder)
            ->getJson("/api/v1/instructor/assignments/{$assignment->id}/submissions")
            ->assertForbidden();

        $this->actingAs($intruder)
            ->postJson("/api/v1/instructor/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
                'grade' => 90,
            ])
            ->assertForbidden();
    });

    it('blocks publishing until the assignment has instructions', function () {
        $owner = assignmentInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $assignment = Assignment::factory()->create([
            'course_id' => $course->id,
            'instructions' => '   ',
        ]);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/assignments/{$assignment->id}/publish")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('instructions');

        expect($assignment->fresh()->status)->toBe(AssignmentStatus::DRAFT);
    });

    it('publishes and unpublishes a complete assignment', function () {
        $owner = assignmentInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $assignment = Assignment::factory()->create([
            'course_id' => $course->id,
            'instructions' => 'Submit your measured values and a short conclusion.',
        ]);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/assignments/{$assignment->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', AssignmentStatus::PUBLISHED->value);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/assignments/{$assignment->id}/unpublish")
            ->assertOk()
            ->assertJsonPath('data.status', AssignmentStatus::DRAFT->value);
    });

    it('lists submissions and grades them with feedback', function () {
        $owner = assignmentInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'max_points' => 80,
        ]);
        $student = User::factory()->create([
            'first_name' => 'Nadia',
            'last_name' => 'Brahim',
        ]);
        $submission = AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
        ]);

        $this
            ->actingAs($owner)
            ->getJson("/api/v1/instructor/assignments/{$assignment->id}/submissions")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.student.first_name', 'Nadia');

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
                'grade' => 72.5,
                'feedback' => 'Clear measurements and a solid conclusion.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'graded')
            ->assertJsonPath('data.grade', 72.5)
            ->assertJsonPath('data.feedback', 'Clear measurements and a solid conclusion.');

        expect($submission->fresh()->graded_by)->toBe($owner->id);
    });

    it('rejects grades outside the assignment maximum', function () {
        $owner = assignmentInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'max_points' => 20,
        ]);
        $submission = AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
        ]);

        $this
            ->actingAs($owner)
            ->postJson("/api/v1/instructor/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
                'grade' => 21,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('grade');
    });

    it('refuses to lower maximum points below an awarded grade', function () {
        $owner = assignmentInstructor();
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $assignment = Assignment::factory()->published()->create([
            'course_id' => $course->id,
            'max_points' => 100,
        ]);
        AssignmentSubmission::factory()->graded()->create([
            'assignment_id' => $assignment->id,
            'grade' => 88,
        ]);

        $this
            ->actingAs($owner)
            ->patchJson("/api/v1/instructor/assignments/{$assignment->id}", [
                'max_points' => 50,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('max_points');
    });
});
