<?php

namespace Database\Factories\Domains\Messaging;

use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MessageConversation>
 */
final class MessageConversationFactory extends Factory
{
    protected $model = MessageConversation::class;

    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'type' => 'direct',
            'subject' => fake()->optional()->sentence(3),
            'status' => 'active',
            'last_message_at' => null,
        ];
    }

    public function group(): static
    {
        return $this->state(fn () => ['type' => 'group']);
    }

    public function staffRoom(): static
    {
        return $this->state(fn () => ['type' => MessagingService::STAFF_ROOM_TYPE, 'subject' => 'Staff Room']);
    }

    public function announcement(): static
    {
        return $this->state(fn () => ['type' => 'announcement']);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => 'archived']);
    }
}
