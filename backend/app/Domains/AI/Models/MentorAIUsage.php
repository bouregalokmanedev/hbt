<?php

namespace App\Domains\AI\Models;

use App\Domains\AI\Enums\MentorAIRequestType;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

final class MentorAIUsage extends Model
{
    use HasFactory;
    protected $table = 'mentor_ai_usages';

    protected $fillable = [
        'user_id',
        'course_id',
        'conversation_id',
        'provider',
        'model',
        'request_type',
        'input_tokens',
        'output_tokens',
        'total_tokens',
        'response_time_ms',
        'successful',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'request_type' => MentorAIRequestType::class,
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'total_tokens' => 'integer',
            'response_time_ms' => 'integer',
            'successful' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}