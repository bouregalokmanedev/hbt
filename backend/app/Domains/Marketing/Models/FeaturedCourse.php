<?php

namespace App\Domains\Marketing\Models;

use App\Models\Course;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class FeaturedCourse extends Model
{
    use HasUuids;

    protected $fillable = ['course_id', 'position', 'badge_label', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
