<?php

namespace App\Domains\AI\Models;

use App\Domains\AI\Enums\MentorMemoryType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MentorMemory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'type',
        'key',
        'value',
        'confidence',
        'source',
        'last_used_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => MentorMemoryType::class,
            'confidence' => 'float',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}