<?php

namespace App\Domains\AI\Models;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Domains\AI\Enums\MentorConversationStatus;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Domains\AI\Models\MentorAIUsage;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;



final class MentorConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'lesson_id',
        'title',
        'context',
        'status',
        'last_message_at',
    ];

    protected function casts(): array
{
    return [
        'context' => 'array',
        'status' => MentorConversationStatus::class,
        'last_message_at' => 'datetime',
    ];
}

    protected static function newFactory()
    {
        return MentorConversationFactory::new();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
    public function messages(): HasMany
{
    return $this->hasMany(MentorMessage::class);
}
public function aiUsages(): HasMany
{
    return $this->hasMany(
        MentorAIUsage::class,
        'conversation_id'
    );
}
}
