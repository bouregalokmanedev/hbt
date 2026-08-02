<?php

namespace App\Models;

use App\Core\Domain\AggregateRoot;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Category extends AggregateRoot
{
    use HasUuids;
    use HasFactory;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [

        'parent_id',

        'name',

        'slug',

        'description',

        'icon',

        'color',

        'sort_order',

        'is_active',

        'metadata',

    ];

    protected function casts(): array
    {
        return [

            'metadata' => 'array',

            'is_active' => 'boolean',

        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(
            Category::class,
            'parent_id'
        );
    }

    public function children(): HasMany
    {
        return $this->hasMany(
            Category::class,
            'parent_id'
        );
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(
            Course::class
        );
    }
}