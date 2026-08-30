<?php

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\Providers\OpenAIMentorAIProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;

uses(RefreshDatabase::class);

it('resolves the mentor AI provider contract to the OpenAI provider', function () {
    $provider = app(MentorAIProvider::class);

    expect($provider)
        ->toBeInstanceOf(OpenAIMentorAIProvider::class);
});