<?php

namespace App\Domains\Messaging\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MessageParticipant extends Model
{
    protected $fillable = ['conversation_id', 'user_id', 'last_read_at'];
    protected function casts(): array { return ['last_read_at' => 'datetime']; }
    public function conversation(): BelongsTo { return $this->belongsTo(MessageConversation::class, 'conversation_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
