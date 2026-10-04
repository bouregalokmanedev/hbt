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
use Database\Factories\Domains\Messaging\MessageConversationFactory;

final class MessageConversation extends Model
{
    use HasFactory;
    use HasUuids;

    /**
     * The staff room is a literal in the database, but nowhere else: this is
     * the single declaration, and `MessagingService::STAFF_ROOM_TYPE` aliases
     * it so the callers that already exist keep working.
     */
    public const STAFF_ROOM_TYPE = 'staff_room';

    /** Every value `type` may ever hold — enforced on write below. */
    public const TYPES = ['direct', 'group', self::STAFF_ROOM_TYPE, 'announcement'];

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['created_by', 'admin_broadcast_id', 'type', 'subject', 'status', 'last_message_at'];

    protected static function booted(): void
    {
        static::saving(function (self $conversation): void {
            // The column default only exists at the database level, so a model
            // that never set `type` would fail validation for no reason.
            $conversation->type = (string) ($conversation->type ?? 'direct');

            if (! in_array($conversation->type, self::TYPES, true)) {
                throw new \InvalidArgumentException(
                    sprintf('Unknown conversation type [%s]. Known types: %s.', $conversation->type, implode(', ', self::TYPES))
                );
            }
        });
    }

    protected static function newFactory(): MessageConversationFactory
    {
        return MessageConversationFactory::new();
    }

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function broadcast(): BelongsTo { return $this->belongsTo(AdminBroadcast::class, 'admin_broadcast_id'); }
    public function participants(): BelongsToMany { return $this->belongsToMany(User::class, 'message_participants', 'conversation_id', 'user_id')->withPivot('last_read_at', 'muted_at')->withTimestamps(); }
    public function participantRows(): HasMany { return $this->hasMany(MessageParticipant::class, 'conversation_id'); }
    public function messages(): HasMany { return $this->hasMany(Message::class, 'conversation_id')->oldest(); }

    /**
     * The one definition of "unread": other people's messages newer than the
     * viewer's last read (or all of theirs when never read) that are not
     * tombstoned for everyone. The per-conversation count is this query with
     * `count()` applied; `unreadTotalsFor()` is the grouped form of the same
     * predicates for the sidebar.
     */
    public function unreadMessagesQuery(User $user): \Illuminate\Database\Eloquent\Builder
    {
        // `getQuery()` unwraps the relation so callers get a plain builder:
        // `messages()` returns a HasMany, which proxies chained calls back to
        // itself rather than to the builder underneath it.
        $query = $this->messages()->getQuery()
            ->reorder()
            ->where('messages.sender_id', '!=', $user->id)
            ->where(fn ($where) => $where
                ->whereNull('messages.metadata')
                ->orWhere('messages.metadata->deleted_for_all', null));

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

        if ($readAt !== null && $readAt !== '') {
            $query->where('messages.created_at', '>', $readAt);
        }

        return $query;
    }

    public function unreadCountFor(User $user): int
    {
        return $this->unreadMessagesQuery($user)->count();
    }

    /**
     * Unread totals for the whole sidebar in one query, keyed by conversation
     * type. Muted conversations still count for the inbox (their row shows the
     * unread pill) but must not light up the sidebar — that is what muting is
     * for — so `muted_at` is the only predicate that differs from the
     * per-conversation count.
     *
     * @return array<string, int> type => total
     */
    public static function unreadTotalsFor(User $user): array
    {
        return Message::query()
            ->join('message_conversations as mc', 'mc.id', '=', 'messages.conversation_id')
            ->join('message_participants as mp', function ($join) use ($user): void {
                $join->on('mp.conversation_id', '=', 'messages.conversation_id')
                    ->where('mp.user_id', $user->id);
            })
            ->whereNull('mp.muted_at')
            ->where('messages.sender_id', '!=', $user->id)
            ->where(function ($query): void {
                $query->whereNull('mp.last_read_at')
                    ->orWhereColumn('messages.created_at', '>', 'mp.last_read_at');
            })
            ->where(function ($query): void {
                $query->whereNull('messages.metadata')
                    ->orWhere('messages.metadata->deleted_for_all', null);
            })
            ->groupBy('mc.type')
            ->selectRaw('mc.type as type, COUNT(*) as total')
            ->pluck('total', 'type')
            ->map(fn ($total): int => (int) $total)
            ->all();
    }
}
