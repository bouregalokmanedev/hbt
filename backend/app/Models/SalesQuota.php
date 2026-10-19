<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesQuota extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'year_month',
        'target',
    ];

    protected function casts(): array
    {
        return [
            'target' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'uuid');
    }
}
