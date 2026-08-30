<?php

namespace App\Domains\Instructor\Queries;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseProgress;

final class InstructorCourseCertificateQuery
{
    public static function for(int $instructorId, string $courseId): array
    {
        $course = Course::query()
            ->whereKey($courseId)
            ->where('instructor_id', $instructorId)
            ->firstOrFail();

        $certificates = Certificate::query()
            ->where('course_id', $course->id)
            ->with('user:id,first_name,last_name,email')
            ->latest('issued_at')
            ->get();

        $completedStudents = CourseProgress::query()
            ->where('course_id', $course->id)
            ->whereNotNull('completed_at')
            ->distinct()
            ->count('user_id');

        return [
            'summary' => [
                'issued' => $certificates->count(),
                'issued_this_month' => $certificates
                    ->filter(fn (Certificate $certificate) => $certificate->issued_at?->isCurrentMonth())
                    ->count(),
                'completed_students' => $completedStudents,
                'issuance_rate' => $completedStudents > 0
                    ? min(100, (int) round(($certificates->count() / $completedStudents) * 100))
                    : 0,
            ],
            'certificates' => $certificates->take(50)->map(fn (Certificate $certificate) => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'student_id' => $certificate->user_id,
                'student_name' => $certificate->user?->full_name ?? $certificate->recipient_name,
                'student_email' => $certificate->user?->email,
                'issued_at' => $certificate->issued_at?->toISOString(),
            ])->values()->all(),
        ];
    }
}
