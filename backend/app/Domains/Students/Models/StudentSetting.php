<?php

namespace App\Domains\Students\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class StudentSetting extends Model
{
    protected $fillable = [
        'user_id',
        'language',
        'timezone',
        'appearance',
        'compact_mode',
        'reduced_motion',
    ];

    protected function casts(): array
    {
        return [
            'compact_mode' => 'boolean',
            'reduced_motion' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}