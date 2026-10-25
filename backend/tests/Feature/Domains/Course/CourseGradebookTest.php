<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticProgress;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
    config([
        'lms.gradebook.weights' => ['lessons' => 60, 'assessments' => 25, 'practicals' => 15],
        'lms.gradebook.pass_threshold' => 70,
    ]);
});

/**
 * @return array{course: Course, lessons: array<int, Lesson>, student: User, assessment: Assessment, scenario: DiagnosticScenario}
 */
function gradebookCourse(): array
{
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $lessons = collect([1, 2])->map(function (int $position) use ($course) {
        $section = Section::factory()->create([
            'course_id' => $course->id,
            'position' => $position,
            'status' => SectionStatus::PUBLISHED,
        ]);

        return Lesson::factory()->create([
            'section_id' => $section->id,
            'position' => 1,
            'status' => LessonStatus::PUBLISHED,
        ]);
    })->all();

    $student = User::factory()->create();
    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => AssessmentStatus::PUBLISHED,
        'is_required' => true,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $student->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 80,
        'passed' => true,
        'completed_at' => now(),
    ]);

    AssessmentResult::create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $student->id,
        'score' => 80,
        'passed' => true,
        'attempt_number' => 1,
        'completed_at' => now(),
    ]);

    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
        'passing_score' => 70,
        'is_required' => true,
    ]);

    CourseDiagnosticScenario::create([
        'course_id' => $course->id,
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'min_score' => 70,
    ]);

    CourseDiagnosticProgress::create([
        'course_id' => $course->id,
        'diagnostic_scenario_id' => $scenario->id,
        'user_id' => $student->id,
        'best_score' => 90,
        'attempts_count' => 1,
        'passed' => true,
        'completed_at' => now(),
    ]);

    return compact('course', 'lessons', 'student', 'assessment', 'scenario');
}

it('returns a weighted gradebook for an enrolled learner', function () {
    ['course' => $course, 'lessons' => $lessons, 'student' => $student] = gradebookCourse();

    LessonProgress::factory()->completed()->create([
        'user_id' => $student->id,
        'lesson_id' => $lessons[0]->id,
    ]);

    $response = $this->actingAs($student)
        ->getJson("/api/v1/courses/{$course->id}/gradebook")
        ->assertOk()
        ->assertJsonPath('data.overall_score', 64)
        ->assertJsonPath('data.letter_grade', 'D')
        ->assertJsonPath('data.passed', false)
        ->assertJsonPath('data.required_passed', true)
        ->assertJsonPath('data.components.0.key', 'lessons')
        ->assertJsonPath('data.components.0.score', 50)
        ->assertJsonPath('data.components.1.score', 80)
        ->assertJsonPath('data.components.2.score', 90);

    LessonProgress::factory()->completed()->create([
        'user_id' => $student->id,
        'lesson_id' => $lessons[1]->id,
    ]);

    $this->actingAs($student)
        ->getJson("/api/v1/courses/{$course->id}/gradebook")
        ->assertOk()
        ->assertJsonPath('data.overall_score', 94)
        ->assertJsonPath('data.letter_grade', 'A')
        ->assertJsonPath('data.passed', true);
});

it('blocks gradebook access for learners who are not enrolled', function () {
    ['course' => $course] = gradebookCourse();

    $this->actingAs(User::factory()->create())
        ->getJson("/api/v1/courses/{$course->id}/gradebook")
        ->assertForbidden();
});

it('gives instructors a roster gradebook scoped to their course', function () {
    ['course' => $course, 'lessons' => $lessons, 'student' => $student] = gradebookCourse();

    LessonProgress::factory()->completed()->create([
        'user_id' => $student->id,
        'lesson_id' => $lessons[0]->id,
    ]);

    $instructor = User::query()->find($course->instructor_id);

    $this->actingAs($instructor)
        ->getJson("/api/v1/instructor/courses/{$course->id}/gradebook")
        ->assertOk()
        ->assertJsonPath('data.summary.students', 1)
        ->assertJsonPath('data.summary.average_score', 64)
        ->assertJsonPath('data.students.0.student.id', $student->id)
        ->assertJsonPath('data.students.0.grade.overall_score', 64);
});

it('hides the roster gradebook from other instructors', function () {
    ['course' => $course] = gradebookCourse();

    $other = User::factory()->create();
    $other->assignRole('Instructor');

    $this->actingAs($other)
        ->getJson("/api/v1/instructor/courses/{$course->id}/gradebook")
        ->assertForbidden();
});
