<?php

namespace App\Models;

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;



class Course extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [

        'instructor_id',

        'title',

        'slug',

        'short_description',

        'description',

        'language',

        'difficulty',

        'duration_minutes',

        'price',

        'discount_price',

        'currency',

        'is_free',

        'status',

        'visibility',

        'published_at',

        'thumbnail',

        'cover_image',

        'preview_video',

        'meta_title',

        'meta_description',

        'metadata',

    ];

    protected function casts(): array
    {
        return [

            'difficulty' => Difficulty::class,

            'status' => CourseStatus::class,

            'visibility' => Visibility::class,

            'metadata' => 'array',

            'published_at' => 'datetime',

            'is_free' => 'boolean',

        ];
    }

    public function instructor()
    {
        return $this->belongsTo(User::class,'instructor_id');
    }
    public function categories(): BelongsToMany
{
    return $this->belongsToMany(
        Category::class
    );
}
public function sections(): HasMany
{
    return $this->hasMany(
        Section::class
    )->orderBy('position');
}
public function enrollments(): HasMany
{
    return $this->hasMany(
        Enrollment::class
    );
}
public function media(): MorphMany
{
    return $this->morphMany(
        Media::class,
        'mediable'
    );
}
public function diagnosticScenarios(): HasMany
{
    return $this->hasMany(
        DiagnosticScenario::class,
        'course_id'
    )->orderBy('position');
}
}