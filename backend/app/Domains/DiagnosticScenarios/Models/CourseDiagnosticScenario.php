<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Models\Course;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CourseDiagnosticScenario extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'course_diagnostic_scenarios';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'course_id',
        'diagnostic_scenario_id',
        'position',
        'is_required',
        'min_score',
        'max_attempts',
        'available_from',
        'available_until',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_required' => 'boolean',
            'min_score' => 'integer',
            'max_attempts' => 'integer',
            'available_from' => 'datetime',
            'available_until' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenario::class,
            'diagnostic_scenario_id'
        );
    }

    public function isAvailableNow(): bool
    {
        $now = now();

        if ($this->available_from !== null && $now->isBefore($this->available_from)) {
            return false;
        }

        if ($this->available_until !== null && $now->isAfter($this->available_until)) {
            return false;
        }

        return true;
    }
}
