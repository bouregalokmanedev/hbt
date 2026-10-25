<?php

namespace App\Domains\Courses\Services;

use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\Courses\Specifications\CourseHasDescriptionSpecification;
use App\Domains\Courses\Specifications\CourseHasDurationSpecification;
use App\Domains\Courses\Specifications\CourseHasPublishedLessonsSpecification;
use App\Domains\Courses\Specifications\CourseHasSectionsSpecification;
use App\Domains\Courses\Specifications\CourseHasThumbnailSpecification;
use App\Domains\Courses\Specifications\CourseHasTitleSpecification;
use App\Models\Course;

final class CourseReadinessService
{
    public function __construct(
        private readonly CourseHasTitleSpecification $hasTitle,
        private readonly CourseHasDescriptionSpecification $hasDescription,
        private readonly CourseHasDurationSpecification $hasDuration,
        private readonly CourseHasThumbnailSpecification $hasThumbnail,
        private readonly CourseHasSectionsSpecification $hasSections,
        private readonly CourseHasPublishedLessonsSpecification $hasPublishedLessons,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function forCourse(Course $course): array
    {
        $checks = [
            $this->check('title', true, $this->hasTitle->isSatisfiedBy($course)),
            $this->check('description', true, $this->hasDescription->isSatisfiedBy($course)),
            $this->check('thumbnail', true, $this->hasThumbnail->isSatisfiedBy($course)),
            $this->check('duration', true, $this->hasDuration->isSatisfiedBy($course)),
            $this->check('sections', true, $this->hasSections->isSatisfiedBy($course)),
            $this->check('published_lessons', true, $this->hasPublishedLessons->isSatisfiedBy($course)),
            $this->check('assessment', false, Assessment::query()
                ->where('course_id', $course->id)
                ->where('status', AssessmentStatus::PUBLISHED->value)
                ->exists()),
            $this->check('practical_scenario', false, CourseDiagnosticScenario::query()
                ->where('course_id', $course->id)
                ->whereHas('scenario', fn ($query) => $query->where('status', DiagnosticScenarioStatus::PUBLISHED->value))
                ->exists()),
        ];

        $passed = count(array_filter($checks, fn (array $check) => $check['passed']));
        $requiredPassed = collect($checks)
            ->filter(fn (array $check) => $check['required'])
            ->every(fn (array $check) => $check['passed']);

        return [
            'course_id' => $course->id,
            'course_status' => $course->status?->value,
            'ready' => $requiredPassed,
            'score' => (int) round($passed / count($checks) * 100),
            'checks' => $checks,
        ];
    }

    /**
     * @return array{key: string, required: bool, passed: bool}
     */
    private function check(string $key, bool $required, bool $passed): array
    {
        return ['key' => $key, 'required' => $required, 'passed' => $passed];
    }
}
