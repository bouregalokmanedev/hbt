<?php

namespace App\Domains\Admin\Queries;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminUserQuery
{
    /** @var array<int, string> */
    private const SORTABLE_COLUMNS = [
        'created_at',
        'email',
        'first_name',
        'last_name',
        'status',
    ];

    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = User::query()->with('roles');

        if (($filters['deleted'] ?? null) === 'only') {
            $query->onlyTrashed();
        } elseif (($filters['deleted'] ?? null) === 'with') {
            $query->withTrashed();
        }

        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $needle = '%' . mb_strtolower($search) . '%';
            $query->where(function ($builder) use ($needle) {
                $builder->whereRaw('LOWER(first_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(username) LIKE ?', [$needle]);
            });
        }

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($role = $filters['role'] ?? null) {
            $query->whereHas('roles', fn ($builder) => $builder->where('name', $role));
        }

        if (($filters['email_verified'] ?? null) === 'true') {
            $query->whereNotNull('email_verified_at');
        } elseif (($filters['email_verified'] ?? null) === 'false') {
            $query->whereNull('email_verified_at');
        }

        if ($createdFrom = $filters['created_from'] ?? null) {
            $query->whereDate('created_at', '>=', $createdFrom);
        }

        if ($createdTo = $filters['created_to'] ?? null) {
            $query->whereDate('created_at', '<=', $createdTo);
        }

        $sort = in_array($filters['sort'] ?? '', self::SORTABLE_COLUMNS, true)
            ? $filters['sort']
            : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query
            ->orderBy($sort, $direction)
            ->paginate(min(max($perPage, 1), 100));
    }
}
