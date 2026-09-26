<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CourseDiagnosticProgress extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'course_diagnostic_progress';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'course_id',
        'diagnostic_scenario_id',
        'user_id',
        'best_score',
        'attempts_count',
        'passed',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'best_score' => 'integer',
            'attempts_count' => 'integer',
            'passed' => 'boolean',
            'completed_at' => 'datetime',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
