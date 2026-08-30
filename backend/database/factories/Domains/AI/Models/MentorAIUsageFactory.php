<?php

namespace Database\Factories\Domains\AI\Models;

use App\Domains\AI\Enums\MentorAIRequestType;
use App\Domains\AI\Models\MentorAIUsage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MentorAIUsage>
 */
class MentorAIUsageFactory extends Factory
{
    protected $model = MentorAIUsage::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'course_id' => null,
            'conversation_id' => null,
            'provider' => 'fake',
            'model' => 'gpt-test',
            'request_type' => MentorAIRequestType::MESSAGE,
            'input_tokens' => 100,
            'output_tokens' => 50,
            'total_tokens' => 150,
            'response_time_ms' => 500,
            'successful' => true,
            'failure_reason' => null,
        ];
    }
}