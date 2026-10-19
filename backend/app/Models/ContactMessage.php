<?php

namespace App\Models;

use App\Enums\LeadStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactMessage extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'inquiry',
        'subject',
        'message',
        'ip',
        'user_agent',
        'visitor_id',
        'read_at',
        'converted_at',
        'status',
        'owner_id',
        'score',
        'source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'course_interest',
        'next_follow_up_at',
        'closed_at',
        'lost_reason',
        'drip_level',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'converted_at' => 'datetime',
            'next_follow_up_at' => 'datetime',
            'closed_at' => 'datetime',
            'status' => LeadStatus::class,
            'score' => 'integer',
            'drip_level' => 'integer',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.($this->last_name ?? ''));
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id', 'uuid');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class, 'contact_message_id');
    }

    /** Follow-up scheduled for today or earlier and not yet closed. */
    public function scopeDue(Builder $query, string $window = 'today'): Builder
    {
        return $query
            ->whereNotNull('next_follow_up_at')
            ->whereNotIn('status', [LeadStatus::WON->value, LeadStatus::LOST->value])
            ->when(
                $window === 'overdue',
                fn (Builder $builder) => $builder->where('next_follow_up_at', '<', now()->startOfDay()),
                fn (Builder $builder) => $builder->where('next_follow_up_at', '<=', now()->endOfDay()),
            );
    }

    public function isOverdue(): bool
    {
        return $this->next_follow_up_at !== null
            && $this->next_follow_up_at->lt(now()->startOfDay())
            && $this->status !== null
            && ! $this->status->isClosed();
    }
}
