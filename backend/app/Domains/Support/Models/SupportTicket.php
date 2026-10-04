<?php

namespace App\Domains\Support\Models;

use App\Domains\Support\Enums\TicketLevel;
use App\Domains\Support\Enums\TicketPriority;
use App\Domains\Support\Enums\TicketStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'subject', 'category', 'priority', 'status',
        'assigned_to', 'level', 'due_at', 'resolved_at', 'closed_at',
        'rating', 'rating_comment', 'rated_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'priority' => TicketPriority::class,
            'level' => TicketLevel::class,
            'due_at' => 'datetime',
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
            'rating' => 'integer',
            'rated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(SupportTicketReply::class, 'ticket_id');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [TicketStatus::OPEN, TicketStatus::PENDING], true);
    }

    public function isOverdue(): bool
    {
        return $this->isOpen() && $this->due_at !== null && $this->due_at->isPast();
    }
}
