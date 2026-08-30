<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\Enums\MentorMemoryType;
use App\Domains\AI\Models\MentorMemory;
use App\Models\User;
use Illuminate\Support\Collection;

final class MentorMemoryService
{
    public function remember(
        User $user,
        MentorMemoryType $type,
        string $key,
        string $value,
        ?string $courseId = null,
        float $confidence = 1.0,
        ?string $source = null,
    ): MentorMemory {
        return MentorMemory::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'course_id' => $courseId,
                'type' => $type,
                'key' => $key,
            ],
            [
                'value' => $value,
                'confidence' => max(0, min(1, $confidence)),
                'source' => $source,
                'last_used_at' => now(),
            ]
        );
    }

    public function relevantFor(
        User $user,
        ?string $courseId = null,
        int $limit = 20,
    ): Collection {
        return MentorMemory::query()
            ->where('user_id', $user->id)
            ->where(function ($query) use ($courseId) {
                $query
                    ->whereNull('course_id');

                if ($courseId !== null) {
                    $query->orWhere('course_id', $courseId);
                }
            })
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderByDesc('confidence')
            ->orderByDesc('last_used_at')
            ->limit($limit)
            ->get();
    }

   public function markUsed(Collection $memories): void
{
    if ($memories->isEmpty()) {
        return;
    }

    MentorMemory::query()
        ->whereKey($memories->pluck('id')->all())
        ->update([
            'last_used_at' => now(),
        ]);
}

    public function forget(MentorMemory $memory): void
    {
        $memory->delete();
    }
}