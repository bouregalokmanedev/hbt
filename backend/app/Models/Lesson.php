<?php

namespace App\Models;

use App\Enums\LessonStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
    'duration_minutes',
    'is_preview',
    'status',
];
    protected function casts(): array
    {
        return [
            'status' => LessonStatus::class,
            'position' => 'integer',
            'duration_minutes' => 'integer',
        'is_preview' => 'boolean',
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
public function progress(): HasMany
{
    return $this->hasMany(
        LessonProgress::class
    );
    }
    

public function progressForUser(): HasOne
{
    return $this->hasOne(LessonProgress::class)
        ->where('user_id', auth()->id());
}
}