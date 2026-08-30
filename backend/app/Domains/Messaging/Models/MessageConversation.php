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
}
