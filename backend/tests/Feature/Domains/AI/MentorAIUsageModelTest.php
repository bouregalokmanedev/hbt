<?php

use App\Domains\AI\Enums\MentorAIRequestType;
use App\Domains\AI\Models\MentorAIUsage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates an AI usage record', function () {
    $user = User::factory()->create();

    $usage = MentorAIUsage::create([
        'user_id' => $user->id,
        'provider' => 'openai',
        'model' => 'gpt-4o-mini',
        'request_type' => MentorAIRequestType::MESSAGE,
        'input_tokens' => 100,
        'output_tokens' => 50,
        'total_tokens' => 150,
        'response_time_ms' => 1200,
        'successful' => true,
    ]);

    expect($usage)
        ->toBeInstanceOf(MentorAIUsage::class)
        ->and($usage->user_id)
        ->toBe($user->id)
        ->and($usage->provider)
        ->toBe('openai')
        ->and($usage->model)
        ->toBe('gpt-4o-mini')
        ->and($usage->input_tokens)
        ->toBe(100)
        ->and($usage->output_tokens)
        ->toBe(50)
        ->and($usage->total_tokens)
        ->toBe(150);
});

it('casts the request type to the mentor AI request type enum', function () {
    $user = User::factory()->create();

    $usage = MentorAIUsage::create([
        'user_id' => $user->id,
        'provider' => 'openai',
        'model' => 'gpt-4o-mini',
        'request_type' => MentorAIRequestType::STREAM,
    ]);

    expect($usage->request_type)
        ->toBe(MentorAIRequestType::STREAM);
});

it('casts token values to integers', function () {
    $user = User::factory()->create();

    $usage = MentorAIUsage::create([
        'user_id' => $user->id,
        'provider' => 'openai',
        'model' => 'gpt-4o-mini',
        'request_type' => MentorAIRequestType::MESSAGE,
        'input_tokens' => '100',
        'output_tokens' => '50',
        'total_tokens' => '150',
    ]);

    expect($usage->input_tokens)
        ->toBeInt()
        ->toBe(100);

    expect($usage->output_tokens)
        ->toBeInt()
        ->toBe(50);

    expect($usage->total_tokens)
        ->toBeInt()
        ->toBe(150);
});

it('belongs to a user', function () {
    $user = User::factory()->create();

    $usage = MentorAIUsage::create([
        'user_id' => $user->id,
        'provider' => 'openai',
        'model' => 'gpt-4o-mini',
        'request_type' => MentorAIRequestType::MESSAGE,
    ]);

    expect($usage->user)
        ->toBeInstanceOf(User::class)
        ->id
        ->toBe($user->id);
});