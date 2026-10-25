<?php

namespace App\Domains\Courses\Services;

use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticProgress;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;

final class CourseGradeService
{
    /**
     * @return array<string, mixed>
     */
    public function forStudent(Course $course, User $user): array
    {
        $weights = (array) config('lms.gradebook.weights', []);
        $threshold = (int) config('lms.gradebook.pass_threshold', 70);

        $components = [];

        $lessons = $this->lessonComponent($course, $user);
        if ($lessons['total'] > 0) {
            $lessons['weight'] = (int) ($weights['lessons'] ?? 0);
            $components['lessons'] = $lessons;
        }

        $assessments = $this->assessmentComponent($course, $user);
        if ($assessments['total'] > 0) {
            $assessments['weight'] = (int) ($weights['assessments'] ?? 0);
            $components['assessments'] = $assessments;
        }

        $practicals = $this->practicalComponent($course, $user);
        if ($practicals['total'] > 0) {
            $practicals['weight'] = (int) ($weights['practicals'] ?? 0);
            $components['practicals'] = $practicals;
        }

        $weightTotal = array_sum(array_column($components, 'weight'));
        $weighted = 0.0;

        foreach ($components as $key => $component) {
            $share = $weightTotal > 0 ? $component['weight'] / $weightTotal : 0;
            $components[$key]['weight_percent'] = (int) round($share * 100);
            $weighted += $component['score'] * $share;
        }

        $score = (int) round($weighted);
        $lessonsPassed = ! isset($components['lessons']) || $components['lessons']['passed'];
        $requiredPassed = collect($components)
            ->flatMap(fn ($component) => $component['items'])
            ->filter(fn ($item) => $item['required'])
            ->every(fn ($item) => $item['passed']);

        $enrollment = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->latest('created_at')
            ->first();

        return [
            'course_id' => $course->id,
            'course_title' => $course->title,
            'user_id' => $user->id,
            'components' => array_values($components),
            'overall_score' => $score,
            'letter_grade' => $this->letter($score),
            'pass_threshold' => $threshold,
            'required_passed' => $requiredPassed,
            'passed' => $components !== [] && $lessonsPassed && $requiredPassed && $score >= $threshold,
            'enrollment_status' => $enrollment?->status?->value,
            'completed_at' => $enrollment?->completed_at?->toISOString(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function roster(Course $course): array
    {
        return Enrollment::query()
            ->where('course_id', $course->id)
            ->whereIn('status', ['active', 'completed'])
            ->with('user')
            ->orderBy('created_at')
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'enrollment_id' => $enrollment->id,
                'enrollment_status' => $enrollment->status->value,
                'student' => [
                    'id' => $enrollment->user->id,
                    'name' => $enrollment->user->full_name,
                    'email' => $enrollment->user->email,
                ],
                'grade' => $this->forStudent($course, $enrollment->user),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function lessonComponent(Course $course, User $user): array
    {
        $sectionIds = Section::query()
            ->where('course_id', $course->id)
            ->where('status', SectionStatus::PUBLISHED->value)
            ->pluck('id');

        $lessons = Lesson::query()
            ->whereIn('section_id', $sectionIds)
            ->where('status', LessonStatus::PUBLISHED->value)
            ->get(['id', 'title']);

        $completedIds = LessonProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->whereNotNull('completed_at')
            ->pluck('lesson_id')
            ->all();

        $total = $lessons->count();
        $completed = count($completedIds);
        $score = $total > 0 ? (int) round($completed / $total * 100) : 0;

        return [
            'key' => 'lessons',
            'label' => 'Lessons',
            'score' => $score,
            'completed' => $completed,
            'total' => $total,
            'passed' => $total > 0 && $completed === $total,
            'required' => true,
            'items' => [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function assessmentComponent(Course $course, User $user): array
    {
        $assessments = Assessment::query()
            ->where('course_id', $course->id)
            ->where('status', AssessmentStatus::PUBLISHED->value)
            ->get(['id', 'title', 'is_required', 'minimum_score']);

        if ($assessments->isEmpty()) {
            return $this->emptyComponent('assessments', 'Assessments');
        }

        $results = AssessmentResult::query()
            ->where('user_id', $user->id)
            ->whereIn('assessment_id', $assessments->pluck('id'))
            ->orderByDesc('score')
            ->get()
            ->keyBy('assessment_id');

        $items = $assessments->map(function (Assessment $assessment) use ($results) {
            $result = $results->get($assessment->id);
            $score = $result !== null ? (int) round((float) $result->score) : 0;

            return [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'score' => $score,
                'minimum_score' => (int) $assessment->minimum_score,
                'passed' => $result !== null && (bool) $result->passed,
                'required' => (bool) $assessment->is_required,
                'attempted' => $result !== null,
            ];
        })->values();

        return [
            'key' => 'assessments',
            'label' => 'Assessments',
            'score' => (int) round($items->avg('score')),
            'completed' => $items->where('passed', true)->count(),
            'total' => $items->count(),
            'passed' => $items->every(fn ($item) => $item['passed']),
            'required' => $items->contains('required', true),
            'items' => $items->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function practicalComponent(Course $course, User $user): array
    {
        $assignments = CourseDiagnosticScenario::query()
            ->where('course_id', $course->id)
            ->with('scenario')
            ->orderBy('position')
            ->get()
            ->filter(fn (CourseDiagnosticScenario $assignment) => $assignment->scenario !== null
                && $assignment->scenario->status === DiagnosticScenarioStatus::PUBLISHED);

        if ($assignments->isEmpty()) {
            return $this->emptyComponent('practicals', 'Practical assessments');
        }

        $progress = CourseDiagnosticProgress::query()
            ->where('course_id', $course->id)
            ->where('user_id', $user->id)
            ->whereIn('diagnostic_scenario_id', $assignments->pluck('diagnostic_scenario_id'))
            ->get()
            ->keyBy('diagnostic_scenario_id');

        $items = $assignments->map(function (CourseDiagnosticScenario $assignment) use ($progress) {
            $row = $progress->get($assignment->diagnostic_scenario_id);
            $minimum = (int) ($assignment->min_score ?? $assignment->scenario->passing_score ?? 70);
            $score = $row !== null ? (int) $row->best_score : 0;

            return [
                'id' => $assignment->scenario->id,
                'title' => $assignment->scenario->title,
                'score' => $score,
                'minimum_score' => $minimum,
                'attempts' => $row !== null ? (int) $row->attempts_count : 0,
                'passed' => $row !== null && ((bool) $row->passed || $score >= $minimum),
                'required' => (bool) $assignment->is_required,
                'attempted' => $row !== null,
            ];
        })->values();

        return [
            'key' => 'practicals',
            'label' => 'Practical assessments',
            'score' => (int) round($items->avg('score')),
            'completed' => $items->where('passed', true)->count(),
            'total' => $items->count(),
            'passed' => $items->every(fn ($item) => $item['passed']),
            'required' => $items->contains('required', true),
            'items' => $items->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyComponent(string $key, string $label): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'score' => 0,
            'completed' => 0,
            'total' => 0,
            'passed' => false,
            'required' => false,
            'items' => [],
        ];
    }

    private function letter(int $score): string
    {
        return match (true) {
            $score >= 90 => 'A',
            $score >= 80 => 'B',
            $score >= 70 => 'C',
            $score >= 60 => 'D',
            default => 'F',
        };
    }
}
