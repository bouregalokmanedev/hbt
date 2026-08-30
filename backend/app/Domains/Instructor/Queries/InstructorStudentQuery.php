<?php

namespace App\Domains\Instructor\Queries;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Enums\EnrollmentStatus;
use App\Models\CourseProgress;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Instructor-facing student read model. It aggregates the established
 * Enrollment, Progress, Quiz, and Assessment domains without modifying them.
 */
final class InstructorStudentQuery
{
    public function __construct(private readonly int $instructorId)
    {
    }

    public static function for(int $instructorId): self
    {
        return new self($instructorId);
    }

    public function paginate(?string $search, int $perPage): LengthAwarePaginator
    {
        $users = User::query()
            ->whereHas('enrollments', fn (Builder $query) => $this->ownedEnrollment($query))
            ->when($search, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate($perPage);

        $userIds = $users->getCollection()->pluck('id');

        $enrollments = Enrollment::query()
            ->with('course:id,title,slug')
            ->whereIn('user_id', $userIds)
            ->where(fn (Builder $query) => $this->ownedEnrollment($query))
            ->get()
            ->groupBy('user_id');

        $progress = CourseProgress::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('course_id', $this->courseIds())
            ->get()
            ->groupBy('user_id');

        return $users->through(function (User $student) use ($enrollments, $progress): array {
            $studentEnrollments = $enrollments->get($student->id, collect());
            $studentProgress = $progress->get($student->id, collect());

            return [
                'student' => $this->studentData($student),
                'courses_count' => $studentEnrollments->count(),
                'completed_courses' => $studentEnrollments
                    ->where('status', EnrollmentStatus::COMPLETED)
                    ->count(),
                'average_progress' => (int) round((float) ($studentProgress->avg('progress_percentage') ?? 0)),
                'last_activity_at' => $studentProgress->max('updated_at')?->toISOString(),
            ];
        });
    }

    public function profile(int $studentId): array
    {
        $student = User::query()->findOrFail($studentId);
        $this->assertCanView($student);

        $courseIds = $this->courseIds();
        $enrollments = Enrollment::query()
            ->with('course:id,title,slug')
            ->where('user_id', $student->id)
            ->whereIn('course_id', $courseIds)
            ->where('status', '!=', EnrollmentStatus::CANCELLED)
            ->get();

        $progress = CourseProgress::query()
            ->where('user_id', $student->id)
            ->whereIn('course_id', $courseIds)
            ->get()
            ->keyBy('course_id');

        $lessonStats = LessonProgress::query()
            ->where('user_id', $student->id)
            ->whereHas('lesson.section', fn (Builder $query) => $query->whereIn('course_id', $courseIds))
            ->with('lesson.section:id,course_id')
            ->get()
            ->groupBy(fn (LessonProgress $item) => $item->lesson->section->course_id)
            ->map(fn ($items) => [
                'completed' => $items->whereNotNull('completed_at')->count(),
                'last_activity_at' => $items->max('updated_at'),
            ]);

        $courses = $enrollments->map(function (Enrollment $enrollment) use ($progress, $lessonStats): array {
            $courseProgress = $progress->get($enrollment->course_id);
            $lessonData = $lessonStats->get($enrollment->course_id, [
                'completed' => 0,
                'last_activity_at' => null,
            ]);

            return [
                'course' => [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'slug' => $enrollment->course->slug,
                ],
                'enrollment' => [
                    'status' => $enrollment->status->value,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                    'completed_at' => $enrollment->completed_at?->toISOString(),
                ],
                'progress' => [
                    'percentage' => $courseProgress?->progress_percentage ?? 0,
                    'time_spent' => $courseProgress?->time_spent ?? 0,
                    'completed_at' => $courseProgress?->completed_at?->toISOString(),
                    'completed_lessons' => $lessonData['completed'],
                    'last_activity_at' => $lessonData['last_activity_at']?->toISOString(),
                ],
            ];
        })->values();

        $quizAttempts = QuizAttempt::query()
            ->with('quiz.section.course:id,title')
            ->where('user_id', $student->id)
            ->whereHas('quiz.section', fn (Builder $query) => $query->whereIn('course_id', $courseIds))
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->limit(20)
            ->get()
            ->map(fn (QuizAttempt $attempt) => [
                'id' => $attempt->id,
                'quiz_title' => $attempt->quiz->title,
                'course_title' => $attempt->quiz->section->course->title,
                'score' => $attempt->percentage,
                'passed' => $attempt->passed,
                'submitted_at' => $attempt->submitted_at?->toISOString(),
            ])->values();

        $assessmentAttempts = AssessmentAttempt::query()
            ->with('assessment.course:id,title')
            ->where('user_id', $student->id)
            ->whereHas('assessment', fn (Builder $query) => $query->whereIn('course_id', $courseIds))
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->limit(20)
            ->get()
            ->map(fn (AssessmentAttempt $attempt) => [
                'id' => $attempt->id,
                'assessment_title' => $attempt->assessment->title,
                'course_title' => $attempt->assessment->course->title,
                'score' => $attempt->score === null ? null : (float) $attempt->score,
                'passed' => $attempt->passed,
                'status' => $attempt->status->value,
                'submitted_at' => $attempt->submitted_at?->toISOString(),
            ])->values();

        /*
         * A read-only learning timeline gives instructors useful context
         * without exposing unrelated platform-wide student activity.
         */
        $lessonActivity = LessonProgress::query()
            ->with('lesson.section.course:id,title')
            ->where('user_id', $student->id)
            ->whereHas('lesson.section', fn (Builder $query) => $query->whereIn('course_id', $courseIds))
            ->latest('updated_at')
            ->limit(15)
            ->get()
            ->map(fn (LessonProgress $item) => [
                'type' => $item->completed_at ? 'lesson_completed' : 'lesson_progress',
                'title' => $item->completed_at ? 'Completed lesson' : 'Continued lesson',
                'detail' => $item->lesson->title . ' · ' . $item->lesson->section->course->title,
                'occurred_at' => ($item->completed_at ?? $item->updated_at)?->toISOString(),
            ]);

        $enrollmentActivity = $enrollments
            ->filter(fn (Enrollment $item) => $item->enrolled_at !== null)
            ->map(fn (Enrollment $item) => [
                'type' => 'enrollment',
                'title' => 'Enrolled in course',
                'detail' => $item->course->title,
                'occurred_at' => $item->enrolled_at?->toISOString(),
            ]);

        $quizActivity = $quizAttempts->map(fn (array $item) => [
            'type' => $item['passed'] ? 'quiz_passed' : 'quiz_submitted',
            'title' => $item['passed'] ? 'Passed quiz' : 'Submitted quiz',
            'detail' => $item['quiz_title'] . ' · ' . $item['score'] . '%',
            'occurred_at' => $item['submitted_at'],
        ]);

        $assessmentActivity = $assessmentAttempts->map(fn (array $item) => [
            'type' => $item['passed'] ? 'assessment_passed' : 'assessment_submitted',
            'title' => $item['passed'] ? 'Passed assessment' : 'Submitted assessment',
            'detail' => $item['assessment_title'] . ($item['score'] === null ? '' : ' · ' . $item['score'] . '%'),
            'occurred_at' => $item['submitted_at'],
        ]);

        $certificates = Certificate::query()
            ->where('user_id', $student->id)
            ->whereIn('course_id', $courseIds)
            ->latest('issued_at')
            ->get()
            ->map(fn (Certificate $certificate) => [
                'id' => $certificate->id,
                'course_id' => $certificate->course_id,
                'course_title' => $certificate->course_title,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at?->toISOString(),
            ])->values();

        $activity = $lessonActivity
            ->concat($enrollmentActivity)
            ->concat($quizActivity)
            ->concat($assessmentActivity)
            ->sortByDesc('occurred_at')
            ->take(20)
            ->values();

        return [
            'student' => $this->studentData($student),
            'courses' => $courses,
            'quiz_attempts' => $quizAttempts,
            'assessment_attempts' => $assessmentAttempts,
            'certificates' => $certificates,
            'activity' => $activity,
        ];
    }

    private function assertCanView(User $student): void
    {
        if (! Enrollment::query()
            ->where('user_id', $student->id)
            ->where(fn (Builder $query) => $this->ownedEnrollment($query))
            ->exists()) {
            throw new ModelNotFoundException();
        }
    }

    private function ownedEnrollment(Builder $query): Builder
    {
        return $query
            ->where('status', '!=', EnrollmentStatus::CANCELLED)
            ->whereHas('course', fn (Builder $courseQuery) => $courseQuery->where('instructor_id', $this->instructorId));
    }

    private function courseIds()
    {
        return \App\Models\Course::query()
            ->where('instructor_id', $this->instructorId)
            ->pluck('id');
    }

    private function studentData(User $student): array
    {
        return [
            'id' => $student->id,
            'name' => $student->full_name,
            'email' => $student->email,
            'username' => $student->username,
            'avatar' => $student->avatar,
            'joined_at' => $student->created_at?->toISOString(),
        ];
    }
}
