<?php

namespace App\Domains\Payments\Models;

use App\Domains\Payments\Enums\PurchaseStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Purchase extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'course_id', 'transaction_id', 'amount', 'currency', 'status', 'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PurchaseStatus::class,
            'amount' => 'integer',
            'refunded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
