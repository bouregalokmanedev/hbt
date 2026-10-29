<?php

namespace App\Models;

use App\Enums\Bootcamps\BootcampDurationUnit;
use App\Enums\Bootcamps\BootcampStatus;
use App\Enums\Courses\Difficulty;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bootcamp extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    public const DEFAULT_INCLUDES = [
        'challenges' => false,
        'resources' => false,
        'quizzes' => false,
        'support' => false,
        'certificate' => false,
        'final_project' => false,
        'classrooms' => false,
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'instructor_id',
        'title',
        'slug',
        'short_description',
        'description',
        'duration_value',
        'duration_unit',
        'location',
        'price',
        'currency',
        'level',
        'includes',
        'status',
        'thumbnail',
        'cover_image',
        'preview_video',
        'brochure_path',
        'brochure_original_name',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'duration_value' => 'integer',
            'duration_unit' => BootcampDurationUnit::class,
            'price' => 'decimal:2',
            'level' => Difficulty::class,
            'includes' => 'array',
            'status' => BootcampStatus::class,
            'published_at' => 'datetime',
        ];
    }

    /**
     * Every include key is always present so the public page can render the
     * instructor's toggles without defensive checks in each component.
     *
     * @return array<string, bool>
     */
    public function normalisedIncludes(): array
    {
        $stored = is_array($this->includes) ? $this->includes : [];

        return array_merge(
            self::DEFAULT_INCLUDES,
            array_intersect_key(
                array_map(static fn ($value) => (bool) $value, $stored),
                self::DEFAULT_INCLUDES
            )
        );
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(BootcampSchedule::class)->orderBy('starts_at');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(BootcampSection::class)->orderBy('position');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(BootcampRegistration::class)->latest('created_at');
    }
}
