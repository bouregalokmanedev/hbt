<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DiagnosticHintUsage extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_hint_usages';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'diagnostic_scenario_attempt_id',
        'diagnostic_scenario_hint_id',
        'user_id',
        'penalty_applied',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'penalty_applied' => 'integer',
            'used_at' => 'datetime',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenario::class,
            'diagnostic_scenario_id'
        );
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenarioAttempt::class,
            'diagnostic_scenario_attempt_id'
        );
    }

    public function hint(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenarioHint::class,
            'diagnostic_scenario_hint_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
