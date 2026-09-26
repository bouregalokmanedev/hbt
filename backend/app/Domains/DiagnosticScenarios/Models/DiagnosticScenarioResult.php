<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DiagnosticScenarioResult extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenario_results';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'diagnostic_scenario_attempt_id',
        'user_id',
        'score',
        'accuracy',
        'process_score',
        'points_earned',
        'points_possible',
        'passed',
        'strengths',
        'weaknesses',
        'breakdown',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'accuracy' => 'integer',
            'process_score' => 'integer',
            'points_earned' => 'integer',
            'points_possible' => 'integer',
            'passed' => 'boolean',
            'strengths' => 'array',
            'weaknesses' => 'array',
            'breakdown' => 'array',
            'generated_at' => 'datetime',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
