<?php

namespace App\Domains\Simulator\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimulatorResult extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'simulator_results';

    protected $fillable = [
        'session_id',
        'user_id',
        'tool',
        'scenario_key',
        'score',
        'outcome',
        'verdict',
        'attempts',
        'hints_used',
        'duration_seconds',
        'steps',
        'metadata',
    ];

    protected $casts = [
        'score' => 'integer',
        'attempts' => 'integer',
        'hints_used' => 'integer',
        'duration_seconds' => 'integer',
        'steps' => 'array',
        'metadata' => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(
            SimulatorSession::class,
            'session_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}