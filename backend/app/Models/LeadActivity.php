<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadActivity extends Model
{
    use HasUuids;

    public const TYPE_NOTE = 'note';

    public const TYPE_CALL = 'call';

    public const TYPE_EMAIL = 'email';

    public const TYPE_WHATSAPP = 'whatsapp';

    public const TYPE_STAGE = 'stage_change';

    public const TYPE_ASSIGNED = 'assigned';

    public const TYPE_FOLLOW_UP = 'follow_up';

    public const TYPE_CREATED = 'created';

    protected $fillable = [
        'contact_message_id',
        'user_id',
        'type',
        'body',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(ContactMessage::class, 'contact_message_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'uuid');
    }
}
