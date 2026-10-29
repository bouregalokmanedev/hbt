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
use Illuminate\Support\Collection;

final class CourseGradeService
{
    public function __construct(
        private readonly CoursePassService $coursePass,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function forStudent(Course $course, User $user): array
    {
        return $this->forUsers($course, collect([$user]))[(int) $user->id];
    }

    /**
     * Grade many learners with a fixed number of queries.
     *
     * @param  iterable<User>  $users
     * @return array<int, array<string, mixed>> Keyed by user id.
     */
    public function forUsers(Course $course, iterable $users): array
    {
        $userCollection = collect($users)->unique('id')->values();

        if ($userCollection->isEmpty()) {
            return [];
        }

        $weights = (array) config('lms.gradebook.weights', []);
        $threshold = (int) config('lms.gradebook.pass_threshold', 70);

        $lessonData = $this->lessonData($course, $userCollection);
        $assessmentData = $this->assessmentData($course, $userCollection);
        $practicalData = $this->practicalData($course, $userCollection);

        $coursePass = $this->coursePass->evaluateForUsers($course, $userCollection);

        $enrollmentStatus = Enrollment::query()
            ->where('course_id', $course->id)
            ->whereIn('user_id', $userCollection->pluck('id'))
            ->latest('created_at')
            ->get()
            ->unique('user_id')
            ->keyBy('user_id');

        return $userCollection
            ->mapWithKeys(function (User $user) use (
                $course,
                $weights,
                $threshold,
                $lessonData,
                $assessmentData,
                $practicalData,
                $coursePass,
                $enrollmentStatus,
            ): array {
                $components = [];

                if ($lessonData['total'] > 0) {
                    $lessons = $this->lessonComponent($lessonData, $user);
                    $lessons['weight'] = (int) ($weights['lessons'] ?? 0);
                    $components['lessons'] = $lessons;
                }

                if ($assessmentData['assessments']->isNotEmpty()) {
                    $assessments = $this->assessmentComponent($assessmentData, $user);
                    $assessments['weight'] = (int) ($weights['assessments'] ?? 0);
                    $components['assessments'] = $assessments;
                }

                if ($practicalData['assignments']->isNotEmpty()) {
                    $practicals = $this->practicalComponent($practicalData, $user);
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

                $pass = $coursePass[(int) $user->id] ?? null;
                $enrollment = $enrollmentStatus->get($user->id);

                return [
                    (int) $user->id => [
                        'course_id' => $course->id,
                        'course_title' => $course->title,
                        'user_id' => $user->id,
                        'components' => array_values($components),
                        'overall_score' => $score,
                        'letter_grade' => $this->letter($score),
                        'pass_threshold' => $threshold,
                        'required_passed' => $requiredPassed,
                        'passed' => $components !== [] && $lessonsPassed && $requiredPassed && $score >= $threshold,
                        'course_passed' => (bool) ($pass['passed'] ?? false),
                        'certificate_ready' => (bool) ($pass['certificate_ready'] ?? false),
                        'requirements' => $pass['requirements'] ?? [],
                        'enrollment_status' => $enrollment?->status?->value,
                        'completed_at' => $enrollment?->completed_at?->toISOString(),
                    ],
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function roster(Course $course): array
    {
        $enrollments = Enrollment::query()
            ->where('course_id', $course->id)
            ->whereIn('status', ['active', 'completed'])
            ->with('user')
            ->orderBy('created_at')
            ->get();

        $users = $enrollments
            ->pluck('user')
            ->filter()
            ->unique('id')
            ->values();

        $grades = $this->forUsers($course, $users);

        return $enrollments
            ->map(fn (Enrollment $enrollment) => [
                'enrollment_id' => $enrollment->id,
                'enrollment_status' => $enrollment->status->value,
                'student' => [
                    'id' => $enrollment->user->id,
                    'name' => $enrollment->user->full_name,
                    'email' => $enrollment->user->email,
                ],
                'grade' => $grades[(int) $enrollment->user_id] ?? null,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, User>  $users
     * @return array{total: int, completed: Collection<int, int>}
     */
    private function lessonData(Course $course, Collection $users): array
    {
        $sectionIds = Section::query()
            ->where('course_id', $course->id)
            ->where('status', SectionStatus::PUBLISHED->value)
            ->pluck('id');

        $lessons = Lesson::query()
            ->whereIn('section_id', $sectionIds)
            ->where('status', LessonStatus::PUBLISHED->value)
            ->get(['id']);

        $completed = LessonProgress::query()
            ->whereIn('user_id', $users->pluck('id'))
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->whereNotNull('completed_at')
            ->get(['user_id'])
            ->groupBy('user_id')
            ->map(fn (Collection $rows) => $rows->count());

        return [
            'total' => $lessons->count(),
            'completed' => $completed,
        ];
    }

    /**
     * @param  Collection<int, User>  $users
     * @return array{assessments: Collection<int, Assessment>, results: Collection<int, Collection<string, AssessmentResult>>}
     */
    private function assessmentData(Course $course, Collection $users): array
    {
        $assessments = Assessment::query()
            ->where('course_id', $course->id)
            ->where('status', AssessmentStatus::PUBLISHED->value)
            ->get(['id', 'title', 'is_required', 'minimum_score']);

        $results = AssessmentResult::query()
            ->whereIn('user_id', $users->pluck('id'))
            ->whereIn('assessment_id', $assessments->pluck('id'))
            ->orderByDesc('score')
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $rows) => $rows->unique('assessment_id')->keyBy('assessment_id'));

        return [
            'assessments' => $assessments,
            'results' => $results,
        ];
    }

    /**
     * @param  Collection<int, User>  $users
     * @return array{assignments: Collection<int, CourseDiagnosticScenario>, progress: Collection<int, Collection<string, CourseDiagnosticProgress>>}
     */
    private function practicalData(Course $course, Collection $users): array
    {
        $assignments = CourseDiagnosticScenario::query()
            ->where('course_id', $course->id)
            ->with('scenario')
            ->orderBy('position')
            ->get()
            ->filter(fn (CourseDiagnosticScenario $assignment) => $assignment->scenario !== null
                && $assignment->scenario->status === DiagnosticScenarioStatus::PUBLISHED)
            ->values();

        $progress = CourseDiagnosticProgress::query()
            ->where('course_id', $course->id)
            ->whereIn('user_id', $users->pluck('id'))
            ->whereIn('diagnostic_scenario_id', $assignments->pluck('diagnostic_scenario_id'))
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $rows) => $rows->keyBy('diagnostic_scenario_id'));

        return [
            'assignments' => $assignments,
            'progress' => $progress,
        ];
    }

    /**
     * @param  array{total: int, completed: Collection<int, int>}  $data
     * @return array<string, mixed>
     */
    private function lessonComponent(array $data, User $user): array
    {
        $total = $data['total'];
        $completed = (int) ($data['completed']->get($user->id) ?? 0);
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
     * @param  array{assessments: Collection<int, Assessment>, results: Collection<int, Collection<string, AssessmentResult>>}  $data
     * @return array<string, mixed>
     */
    private function assessmentComponent(array $data, User $user): array
    {
        $results = $data['results']->get($user->id, collect());

        $items = $data['assessments']->map(function (Assessment $assessment) use ($results) {
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
     * @param  array{assignments: Collection<int, CourseDiagnosticScenario>, progress: Collection<int, Collection<string, CourseDiagnosticProgress>>}  $data
     * @return array<string, mixed>
     */
    private function practicalComponent(array $data, User $user): array
    {
        $progress = $data['progress']->get($user->id, collect());

        $items = $data['assignments']->map(function (CourseDiagnosticScenario $assignment) use ($progress) {
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
