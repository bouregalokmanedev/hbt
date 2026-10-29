<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BootcampLesson extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'bootcamp_section_id',
        'title',
        'classroom_count',
        'duration_minutes',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'classroom_count' => 'integer',
            'duration_minutes' => 'integer',
            'position' => 'integer',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(BootcampSection::class, 'bootcamp_section_id');
    }
}
