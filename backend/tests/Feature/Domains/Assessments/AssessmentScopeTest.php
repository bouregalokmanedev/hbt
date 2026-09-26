<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
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

function scopedCourse(User $user, int $sections = 2, int $lessonsPerSection = 2): Course
{
    $course = Course::factory()->create(['status' => 'published']);

    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    foreach (range(1, $sections) as $s) {
        $section = Section::factory()->create([
            'course_id' => $course->id,
            'position' => $s,
            'status' => SectionStatus::PUBLISHED,
        ]);

        foreach (range(1, $lessonsPerSection) as $l) {
            Lesson::factory()->create([
                'section_id' => $section->id,
                'position' => $l,
                'status' => LessonStatus::PUBLISHED,
            ]);
        }
    }

    return $course->fresh();
}

function completeLessons(User $user, $lessons): void
{
    foreach ($lessons as $lesson) {
        \App\Models\LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            ['progress_percentage' => 100, 'completed_at' => now()],
        );
    }
}

function eligibility(): AssessmentEligibilityService
{
    return app(AssessmentEligibilityService::class);
}

it('starts a lesson-scoped formative mid-course without completing lessons', function () {
    $user = User::factory()->create();
    $course = scopedCourse($user);

    $lesson = $course->sections->first()->lessons->first();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    // No lessons completed anywhere — course assessment would fail.
    expect(eligibility()->isEligible($assessment, $user))->toBeTrue();
    expect(eligibility()->evaluate($assessment, $user)['lessons']['scope'])->toBe('lesson');
});

it('denies lesson scope when the lesson is not accessible', function () {
    $user = User::factory()->create();
    $course = scopedCourse($user);

    $lesson = $course->sections->first()->lessons->first();
    $lesson->update(['status' => LessonStatus::DRAFT]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    expect(eligibility()->isEligible($assessment, $user))->toBeFalse();
});

it('narrows section scope to its own lessons', function () {
    $user = User::factory()->create();
    $course = scopedCourse($user);

    $sectionA = $course->sections->sortBy('position')->values()->first();
    $sectionB = $course->sections->sortBy('position')->values()->get(1);

    // Complete only section A.
    completeLessons($user, $sectionA->lessons);

    $assessmentA = Assessment::factory()->create([
        'course_id' => $course->id,
        'section_id' => $sectionA->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);
    $assessmentB = Assessment::factory()->create([
        'course_id' => $course->id,
        'section_id' => $sectionB->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    expect(eligibility()->isEligible($assessmentA, $user))->toBeTrue();
    expect(eligibility()->isEligible($assessmentB, $user))->toBeFalse();
});

it('gates course assessments on required section assessments', function () {
    $user = User::factory()->create();
    $course = scopedCourse($user);
    completeLessons($user, $course->sections->flatMap(fn ($s) => $s->lessons));

    $sectionA = $course->sections->sortBy('position')->values()->first();

    $sectionAssessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'section_id' => $sectionA->id,
        'status' => 'published',
        'is_required' => true,
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    $final = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'is_required' => true,
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    $evidence = eligibility()->evaluate($final, $user);
    expect($evidence['eligible'])->toBeFalse();
    expect($evidence['section_assessments']['required'])->toBe(1);

    AssessmentResult::factory()->create([
        'assessment_id' => $sectionAssessment->id,
        'user_id' => $user->id,
        'score' => 90,
        'passed' => true,
        'attempt_number' => 1,
    ]);

    expect(eligibility()->isEligible($final->fresh(), $user))->toBeTrue();
});

it('keeps unscoped course behavior unchanged', function () {
    $user = User::factory()->create();
    $course = scopedCourse($user, 1, 2);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    // One of two lessons done → ineligible, as before.
    completeLessons($user, [$course->sections->first()->lessons->first()]);
    expect(eligibility()->isEligible($assessment, $user))->toBeFalse();

    completeLessons($user, $course->sections->first()->lessons);
    expect(eligibility()->isEligible($assessment->fresh(), $user))->toBeTrue();
});

it('validates scope consistency on create', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    $otherCourse = Course::factory()->create();

    $foreignSection = Section::factory()->create(['course_id' => $otherCourse->id]);

    expect(fn () => app(\App\Domains\Instructor\Actions\Assessments\CreateAssessmentAction::class)->execute(
        $course,
        $instructor,
        ['title' => 'Bad scope '.fake()->unique()->word(), 'section_id' => $foreignSection->id],
    ))->toThrow(LogicException::class, 'The section must belong to the assessment course.');

    $section = Section::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $otherSection = Section::factory()->create(['course_id' => $course->id, 'position' => 2]);
    $lesson = Lesson::factory()->create(['section_id' => $otherSection->id]);

    expect(fn () => app(\App\Domains\Instructor\Actions\Assessments\CreateAssessmentAction::class)->execute(
        $course,
        $instructor,
        ['title' => 'Bad scope '.fake()->unique()->word(), 'section_id' => $section->id, 'lesson_id' => $lesson->id],
    ))->toThrow(LogicException::class, 'The lesson must belong to the assessment section.');
});

it('exposes scope on the student details', function () {
    $user = User::factory()->create();
    $course = scopedCourse($user);
    $lesson = $course->sections->first()->lessons->first();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    $details = app(\App\Domains\StudentAssessments\Actions\GetAssessmentDetailsAction::class)
        ->execute($assessment, $user);

    expect($details['eligibility']['assessment']['scope'])->toBe('lesson');
});
