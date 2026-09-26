<?php

namespace App\Domains\Messaging\Models;

use App\Domains\Notifications\Models\AdminBroadcast;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class MessageConversation extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['created_by', 'admin_broadcast_id', 'type', 'subject', 'status', 'last_message_at'];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function broadcast(): BelongsTo { return $this->belongsTo(AdminBroadcast::class, 'admin_broadcast_id'); }
    public function participants(): BelongsToMany { return $this->belongsToMany(User::class, 'message_participants', 'conversation_id', 'user_id')->withPivot('last_read_at')->withTimestamps(); }
    public function participantRows(): HasMany { return $this->hasMany(MessageParticipant::class, 'conversation_id'); }
    public function messages(): HasMany { return $this->hasMany(Message::class, 'conversation_id')->oldest(); }

    /**
     * Messages from other participants newer than the viewer's last_read_at
     * (or all of the others' messages when never read), excluding
     * messages soft-deleted for everyone.
     */
    public function unreadCountFor(User $user): int
    {
        $readAt = null;
        if ($this->relationLoaded('participants')) {
            $viewer = $this->participants->first(fn ($participant) => (int) $participant->id === (int) $user->id);
            $readAt = $viewer?->pivot?->last_read_at;
        } else {
            $readAt = MessageParticipant::query()
                ->where('message_participants.conversation_id', $this->id)
                ->where('message_participants.user_id', $user->id)
                ->value('message_participants.last_read_at');
        }

        $query = $this->messages()->reorder()->where('messages.sender_id', '!=', $user->id);
        if ($readAt !== null && $readAt !== '') {
            $query->where('messages.created_at', '>', $readAt);
        }

        return $query
            ->get(['messages.id', 'messages.sender_id', 'messages.created_at', 'messages.metadata'])
            ->reject(fn (Message $message) => $message->isDeletedForAll())
            ->count();
    }
}
