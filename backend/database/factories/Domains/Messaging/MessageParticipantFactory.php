<?php

namespace Database\Factories\Domains\Messaging;

use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Models\MessageParticipant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MessageParticipant>
 */
final class MessageParticipantFactory extends Factory
{
    protected $model = MessageParticipant::class;

    public function definition(): array
    {
        return [
            'conversation_id' => MessageConversation::factory(),
            'user_id' => User::factory(),
            'last_read_at' => null,
            'muted_at' => null,
        ];
    }

    public function read(): static
    {
        return $this->state(fn () => ['last_read_at' => now()]);
    }

    public function muted(): static
    {
        return $this->state(fn () => ['muted_at' => now()]);
    }
}
