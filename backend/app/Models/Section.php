<?php

namespace App\Models;

use App\Enums\SectionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Section extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'course_id',
        'title',
        'slug',
        'description',
        'position',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => SectionStatus::class,
            'position' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(
            Course::class
        );
    }
}