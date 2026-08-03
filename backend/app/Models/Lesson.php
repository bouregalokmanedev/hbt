<?php

namespace App\Models;

use App\Enums\LessonStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Lesson extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'section_id',
        'title',
        'slug',
        'description',
        'content',
        'position',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => LessonStatus::class,
            'position' => 'integer',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(
            Section::class
        );
    }
    public function media(): MorphMany
{
    return $this->morphMany(
        Media::class,
        'mediable'
    );
}
}