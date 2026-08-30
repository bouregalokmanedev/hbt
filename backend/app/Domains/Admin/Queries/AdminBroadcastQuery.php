<?php

namespace App\Domains\Admin\Queries;

use App\Domains\Notifications\Models\AdminBroadcast;
use App\Domains\Notifications\Models\StudentNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminBroadcastQuery
{
    public function paginate(int $perPage): LengthAwarePaginator
    {
        return AdminBroadcast::query()
            ->with('administrator:id,uuid,first_name,last_name,email')
            ->select('admin_broadcasts.*')
            ->selectSub(
                StudentNotification::query()
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('student_notifications.admin_broadcast_id', 'admin_broadcasts.id')
                    ->whereNotNull('read_at'),
                'read_count',
            )
            ->latest('created_at')
            ->paginate(min(max($perPage, 1), 100));
    }

    public function readCount(AdminBroadcast $broadcast): int
    {
        return StudentNotification::query()
            ->where('admin_broadcast_id', $broadcast->id)
            ->whereNotNull('read_at')
            ->count();
    }
}
