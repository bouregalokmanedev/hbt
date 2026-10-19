<?php

namespace App\Domains\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Discount extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'code', 'description', 'type', 'value', 'currency',
        'applies_to', 'course_ids', 'starts_at', 'ends_at',
        'max_uses', 'used_count', 'active', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'course_ids' => 'array',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'active' => 'boolean',
            'used_count' => 'integer',
            'value' => 'integer',
            'max_uses' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isLive(): bool
    {
        if (! $this->active) {
            return false;
        }
        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }
        if ($this->ends_at && $now->gt($this->ends_at)) {
            return false;
        }
        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    /**
     * Discount in minor units for the given order lines.
     *
     * @param list<array{course_id?: string, unit_price: int, quantity: int}> $lines
     */
    public function amountFor(array $lines): int
    {
        $eligible = $lines;
        if ($this->applies_to === 'courses') {
            $ids = array_map('strval', (array) ($this->course_ids ?? []));
            $eligible = array_values(array_filter(
                $lines,
                fn ($line) => in_array((string) ($line['course_id'] ?? ''), $ids, true),
            ));
        }
        if ($eligible === []) {
            return 0;
        }
        $base = array_sum(array_map(fn ($line) => $line['unit_price'] * $line['quantity'], $eligible));
        if ($base <= 0) {
            return 0;
        }
        if ($this->type === 'fixed') {
            return min((int) $this->value, $base);
        }

        return (int) floor($base * min((int) $this->value, 100) / 100);
    }
}
