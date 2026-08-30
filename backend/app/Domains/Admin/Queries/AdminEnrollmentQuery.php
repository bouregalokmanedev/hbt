<?php

namespace App\Domains\Admin\Queries;

use App\Models\CourseProgress;
use App\Models\Enrollment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminEnrollmentQuery
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $progressPercentage = CourseProgress::query()
            ->select('progress_percentage')
            ->whereColumn('course_progress.user_id', 'enrollments.user_id')
            ->whereColumn('course_progress.course_id', 'enrollments.course_id')
            ->limit(1);

        $query = Enrollment::query()
            ->select('enrollments.*')
            ->selectSub($progressPercentage, 'progress_percentage')
            ->with([
                'user:id,uuid,first_name,last_name,email',
                'course:id,title,slug,status',
            ]);

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($student = $filters['student'] ?? null) {
            $query->whereHas('user', fn ($builder) => $builder->where('uuid', $student));
        }

        if ($course = $filters['course'] ?? null) {
            $query->where('course_id', $course);
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('enrolled_at', '>=', $dateFrom);
        }

        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('enrolled_at', '<=', $dateTo);
        }

        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->whereHas('user', function ($users) use ($search) {
                    $users->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('course', fn ($courses) => $courses->where('title', 'like', "%{$search}%"));
            });
        }

        return $query
            ->latest('enrolled_at')
            ->paginate(min(max($perPage, 1), 100));
    }
}
