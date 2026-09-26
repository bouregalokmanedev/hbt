<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuthenticationLog;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminStudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $search = trim((string) $request->query('search', ''));

        $query = User::query()
            ->whereHas('roles', fn ($builder) => $builder->where('name', UserRole::STUDENT->value));

        if ($search !== '') {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function ($builder) use ($needle) {
                $builder->whereRaw('LOWER(first_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            });
        }

        $students = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $students->getCollection()->map(function (User $student) {
            $enrollmentIds = Enrollment::query()->where('user_id', $student->id);
            $completed = (clone $enrollmentIds)->where('status', 'completed')->count();
            $certificates = Certificate::query()->where('user_id', $student->id)->count();
            $lastActive = CourseProgress::query()->where('user_id', $student->id)->max('updated_at');

            return [
                'id' => $student->uuid,
                'name' => $student->full_name,
                'email' => $student->email,
                'status' => $student->status,
                'verified' => $student->hasVerifiedEmail(),
                'enrollments_count' => (clone $enrollmentIds)->count(),
                'completed_count' => $completed,
                'certificates_count' => $certificates,
                'last_active_at' => $lastActive,
                'joined_at' => $student->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function show(User $student): JsonResponse
    {
        $this->authorize('view', $student);
        abort_unless($student->hasRole(UserRole::STUDENT->value), 404, 'Student not found.');

        $enrollments = Enrollment::query()
            ->with('course:id,title,status')
            ->where('user_id', $student->id)
            ->latest()
            ->get();

        $journey = $enrollments->map(function (Enrollment $enrollment) use ($student) {
            $course = $enrollment->course;
            if (! $course) {
                return null;
            }

            $courseProgress = CourseProgress::query()
                ->where('user_id', $student->id)
                ->where('course_id', $course->id)
                ->first();

            $sections = Section::query()
                ->with(['lessons:id,section_id,title,position,duration_minutes'])
                ->where('course_id', $course->id)
                ->orderBy('position')
                ->get();

            $sectionProgress = SectionProgress::query()
                ->where('user_id', $student->id)
                ->whereIn('section_id', $sections->pluck('id'))
                ->get()
                ->keyBy('section_id');

            $lessonProgress = LessonProgress::query()
                ->where('user_id', $student->id)
                ->whereIn('lesson_id', $sections->flatMap->lessons->pluck('id'))
                ->get()
                ->keyBy('lesson_id');

            $sectionsData = $sections->map(function (Section $section) use ($sectionProgress, $lessonProgress) {
                $progress = $sectionProgress->get($section->id);
                return [
                    'id' => $section->id,
                    'title' => $section->title,
                    'position' => $section->position,
                    'progress_percentage' => $progress?->progress_percentage ?? 0,
                    'is_completed' => $progress?->completed_at !== null,
                    'lessons' => $section->lessons->sortBy('position')->values()->map(function (Lesson $lesson) use ($lessonProgress) {
                        $item = $lessonProgress->get($lesson->id);
                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'position' => $lesson->position,
                            'duration_minutes' => $lesson->duration_minutes,
                            'progress_percentage' => $item?->progress_percentage ?? 0,
                            'is_completed' => $item?->completed_at !== null,
                            'time_spent' => $item?->time_spent ?? 0,
                        ];
                    }),
                ];
            });

            return [
                'enrollment_id' => $enrollment->id,
                'enrollment_status' => $enrollment->status instanceof \BackedEnum ? $enrollment->status->value : (string) $enrollment->status,
                'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                'completed_at' => $enrollment->completed_at?->toISOString(),
                'course' => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status instanceof \BackedEnum ? $course->status->value : (string) $course->status,
                ],
                'progress' => [
                    'progress_percentage' => $courseProgress?->progress_percentage ?? 0,
                    'time_spent' => $courseProgress?->time_spent ?? 0,
                    'completed_at' => $courseProgress?->completed_at?->toISOString(),
                ],
                'sections' => $sectionsData,
            ];
        })->filter()->values();

        $quizAttempts = QuizAttempt::query()
            ->with('quiz:id,title')
            ->where('user_id', $student->id)
            ->latest('submitted_at')
            ->limit(20)
            ->get()
            ->map(fn (QuizAttempt $attempt) => [
                'id' => $attempt->id,
                'quiz' => $attempt->quiz?->title,
                'score' => $attempt->score,
                'total_points' => $attempt->total_points,
                'percentage' => $attempt->percentage,
                'passed' => (bool) $attempt->passed,
                'status' => $attempt->status,
                'submitted_at' => $attempt->submitted_at?->toISOString(),
            ]);

        $assessmentAttempts = AssessmentAttempt::query()
            ->with('assessment:id,title')
            ->where('user_id', $student->id)
            ->latest('submitted_at')
            ->limit(20)
            ->get()
            ->map(function (AssessmentAttempt $attempt) {
                $result = AssessmentResult::query()
                    ->where('assessment_attempt_id', $attempt->id)
                    ->first();
                return [
                    'id' => $attempt->id,
                    'assessment' => $attempt->assessment?->title,
                    'score' => $attempt->score,
                    'passed' => (bool) $attempt->passed,
                    'status' => $attempt->status,
                    'result_score' => $result?->score,
                    'result_passed' => $result ? (bool) $result->passed : null,
                    'submitted_at' => $attempt->submitted_at?->toISOString(),
                ];
            });

        $certificates = Certificate::query()
            ->where('user_id', $student->id)
            ->latest('issued_at')
            ->get(['id', 'certificate_number', 'course_title', 'issued_at'])
            ->map(fn (Certificate $certificate) => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'course_title' => $certificate->course_title,
                'issued_at' => $certificate->issued_at?->toISOString(),
            ]);

        $activity = AuthenticationLog::query()
            ->where('user_id', $student->id)
            ->latest()
            ->limit(10)
            ->get(['event', 'successful', 'ip_address', 'created_at'])
            ->map(fn (AuthenticationLog $log) => [
                'event' => $log->event,
                'successful' => (bool) $log->successful,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toISOString(),
            ]);

        $simulator = \App\Domains\Simulator\Queries\SimulatorActivityQuery::forAdmin()
            ->studentActivity($student->id);

        return response()->json([
            'success' => true,
            'message' => 'Student learning journey retrieved.',
            'data' => [
                'id' => $student->uuid,
                'name' => $student->full_name,
                'email' => $student->email,
                'status' => $student->status,
                'verified' => $student->hasVerifiedEmail(),
                'joined_at' => $student->created_at?->toISOString(),
                'summary' => [
                    'enrollments' => $enrollments->count(),
                    'completed' => $enrollments->filter(
                        fn (Enrollment $item) => ($item->status instanceof \BackedEnum ? $item->status->value : (string) $item->status) === 'completed',
                    )->count(),
                    'certificates' => $certificates->count(),
                    'quiz_attempts' => QuizAttempt::query()->where('user_id', $student->id)->count(),
                    'assessment_attempts' => AssessmentAttempt::query()->where('user_id', $student->id)->count(),
                    'simulator_sessions' => $simulator['summary']['sessions'],
                ],
                'journey' => $journey,
                'quiz_attempts' => $quizAttempts,
                'assessment_attempts' => $assessmentAttempts,
                'certificates' => $certificates,
                'simulator' => [
                    'summary' => $simulator['summary'],
                    'sessions' => $simulator['sessions'],
                ],
                'activity' => $activity,
            ],
        ]);
    }
}
