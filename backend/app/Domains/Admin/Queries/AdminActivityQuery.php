<?php

namespace App\Domains\Admin\Queries;

use App\Models\AuditLog;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminActivityQuery
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = AuditLog::query()->with('user:id,uuid,first_name,last_name,email');

        if ($actor = $filters['actor'] ?? null) {
            $query->whereHas('user', fn ($users) => $users->where('uuid', $actor));
        }

        if ($event = trim((string) ($filters['event'] ?? ''))) {
            $query->where('event', $event);
        }

        if ($targetType = $this->targetType($filters['target_type'] ?? null)) {
            $query->where('auditable_type', $targetType);
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('event', 'like', "%{$search}%")
                    ->orWhere('auditable_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($users) use ($search) {
                        $users->where('email', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        return $query
            ->latest('created_at')
            ->paginate(min(max($perPage, 1), 100));
    }

    private function targetType(?string $type): ?string
    {
        return match ($type) {
            'course', 'Course' => Course::class,
            'enrollment', 'Enrollment' => Enrollment::class,
            'user', 'User' => User::class,
            default => null,
        };
    }
}
