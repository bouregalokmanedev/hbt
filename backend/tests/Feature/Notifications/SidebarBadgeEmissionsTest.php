<?php

use App\Domains\Assessments\Actions\SubmitAssessmentAttemptAction;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Enums\AssessmentMode;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Challenges\Models\DailyChallengeAssignment;
use App\Domains\Challenges\Models\DailyChallengeDef;
use App\Domains\Challenges\Services\DailyChallengeService;
use App\Domains\Courses\Events\SectionPublished;
use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Lessons\Events\LessonPublished;
use App\Domains\Lessons\Listeners\SendLessonPublishedNotification;
use App\Domains\Courses\Listeners\SendSectionPublishedNotification;
use App\Domains\Instructor\Actions\Assessments\PublishAssessmentAction;
use App\Domains\Notifications\Models\StudentNotification;
use App\Domains\Progression\Services\StudentProgressionService;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Illuminate\Support\Facades\Mail;

function emitSidebarBadges(User $user): array
{
    return test()->actingAs($user)
        ->getJson('/api/v1/notifications/sidebar-badges')
        ->assertOk()
        ->json('data');
}

/**
 * The very first XP award on a fresh profile also fires the pre-existing
 * level_up notice onto /achievements, so settle the level and clear the
 * slate before measuring an Achievements badge.
 */
function settleAchievementsSlate(User $user): void
{
    app(StudentProgressionService::class)->award($user, 'warmup', 1, 1, 'warmup:sidebar-badge-test');
    StudentNotification::where('user_id', $user->id)->delete();
}

beforeEach(function () {
    Mail::fake();
});

it('lights the My Courses badge when a course unlocks and again when it is cancelled', function () {
    $student = User::factory()->create();
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    app(CreateEnrollmentAction::class)->execute($student->id, $course);

    $afterEnroll = emitSidebarBadges($student);

    expect($afterEnroll['my-courses'])->toBe(1)
        ->and($afterEnroll['assessments'])->toBe(0);

    $enrollment = Enrollment::where('user_id', $student->id)
        ->where('course_id', $course->id)
        ->firstOrFail();

    app(CancelEnrollmentAction::class)->execute($enrollment);

    expect(emitSidebarBadges($student)['my-courses'])->toBe(2);
});

it('lights the My Courses badge when a lesson and a section are published', function () {
    $student = User::factory()->create();
    $course = Course::factory()->create();
    $section = Section::factory()->create(['course_id' => $course->id]);
    $lesson = Lesson::factory()->create(['section_id' => $section->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
    ]);

    // LessonPublished/SectionPublished are ShouldDispatchAfterCommit, which a
    // RefreshDatabase test transaction never commits, so run the listeners
    // the same way the audit tests do.
    app(SendLessonPublishedNotification::class)->handle(new LessonPublished($lesson));
    expect(emitSidebarBadges($student)['my-courses'])->toBe(1);

    app(SendSectionPublishedNotification::class)->handle(new SectionPublished($section));
    expect(emitSidebarBadges($student)['my-courses'])->toBe(2);
});

it('files a passed result under Assessments and the minted certificate under Certificates', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
        'assessment_mode' => AssessmentMode::SUMMATIVE,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    app(SubmitAssessmentAttemptAction::class)->execute($attempt, $user, 85);

    $badges = emitSidebarBadges($user);

    expect($badges['assessments'])->toBe(1)
        ->and($badges['certificates'])->toBe(1);
});

it('lights the Assessments badge when a new assessment is published for an enrolled course', function () {
    $instructor = User::factory()->create();
    $student = User::factory()->create();

    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => AssessmentStatus::DRAFT,
        'assessment_mode' => AssessmentMode::PRACTICE,
    ]);

    AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id]);

    app(PublishAssessmentAction::class)->execute($assessment, $instructor);

    $badges = emitSidebarBadges($student);

    expect($badges['assessments'])->toBe(1);
});

it('lights the Achievements badge when a peer bonus lands on the target student', function () {
    $giver = User::factory()->create();
    $target = User::factory()->create();

    settleAchievementsSlate($target);

    $this->actingAs($giver)
        ->postJson('/api/v1/leaderboard/bonus', ['target_user_id' => $target->id])
        ->assertOk();

    expect(emitSidebarBadges($target)['achievements'])->toBe(1);
});

it('lights the Achievements badge when a completed daily challenge is claimed', function () {
    $student = User::factory()->create();

    settleAchievementsSlate($student);

    $def = DailyChallengeDef::create([
        'key' => 'sidebar-badge-claim',
        'title' => 'Finish one lesson',
        'description' => 'Complete any lesson today.',
        'action' => 'lesson_complete',
        'xp' => 10,
        'target' => 1,
        'is_active' => true,
    ]);

    $assignment = DailyChallengeAssignment::create([
        'user_id' => $student->id,
        'daily_challenge_def_id' => $def->id,
        'date' => now()->toDateString(),
        'status' => 'completed',
        'progress' => 1,
        'target' => 1,
    ]);

    app(DailyChallengeService::class)->claim($student, (string) $assignment->id);

    expect(emitSidebarBadges($student)['achievements'])->toBe(1);
});

it('lights the Support badge when a ticket is assigned and again when it is escalated', function () {
    $this->seed(AccessControlSeeder::class);

    $owner = User::factory()->create();
    $owner->assignRole(\App\Enums\UserRole::STUDENT->value);

    $agent = User::factory()->create();
    $agent->assignRole(\App\Enums\UserRole::SUPPORT->value);

    $ticket = $this->actingAs($owner)
        ->postJson('/api/v1/support/tickets', [
            'subject' => 'Sidebar badge regression',
            'message' => 'Support notifications never reach the sidebar badge.',
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($agent)
        ->patchJson("/api/v1/support-desk/tickets/{$ticket['id']}/assign", [
            'assignee_id' => $agent->uuid,
        ])
        ->assertOk();

    expect(emitSidebarBadges($owner)['support'])->toBe(1);

    $this->actingAs($agent)
        ->postJson("/api/v1/support-desk/tickets/{$ticket['id']}/escalate", [
            'level' => 'admin',
        ])
        ->assertOk();

    expect(emitSidebarBadges($owner)['support'])->toBe(2);
});

it('lights the Support badge when support answers a student through the mailbox', function () {
    $this->seed(AccessControlSeeder::class);

    $student = User::factory()->create();
    $student->assignRole(\App\Enums\UserRole::STUDENT->value);

    $agent = User::factory()->create();
    $agent->assignRole(\App\Enums\UserRole::SUPPORT->value);

    $this->actingAs($agent)
        ->postJson('/api/v1/support-desk/mail', [
            'to_email' => $student->email,
            'to_name' => $student->full_name,
            'subject' => 'Your ticket is resolved',
            'body' => 'Thanks for reaching out, we have closed the loop on this one.',
            'recipient_user_id' => $student->uuid,
        ])
        ->assertCreated();

    expect(emitSidebarBadges($student)['support'])->toBe(1);
});
