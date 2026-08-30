<?php

namespace App\Domains\Admin\Queries;

use App\Models\Course;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminCourseQuery
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Course::query()
            ->with([
                'instructor:id,uuid,first_name,last_name,email',
                'categories:id,name,slug',
            ])
            ->withCount('enrollments');

        foreach (['status', 'difficulty', 'language', 'visibility'] as $filter) {
            if ($value = $filters[$filter] ?? null) {
                $query->where($filter, $value);
            }
        }

        if (isset($filters['instructor']) && $filters['instructor'] !== '') {
            $query->where('instructor_id', $filters['instructor']);
        }

        if (isset($filters['category']) && $filters['category'] !== '') {
            $query->whereHas('categories', fn ($builder) => $builder->where('categories.id', $filters['category']));
        }

        if (in_array($filters['free'] ?? null, ['true', 'false'], true)) {
            $query->where('is_free', $filters['free'] === 'true');
        }

        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        return $query
            ->latest('updated_at')
            ->paginate(min(max($perPage, 1), 100));
    }
}
