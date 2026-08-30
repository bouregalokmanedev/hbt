<?php

use App\Domains\AI\Models\MentorConversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows a user to view their own conversation', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($user->can('view', $conversation))
        ->toBeTrue();
});

it('does not allow a user to view another users conversation', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    expect($otherUser->can('view', $conversation))
        ->toBeFalse();
});

it('allows a user to create a conversation', function () {
    $user = User::factory()->create();

    expect($user->can('create', MentorConversation::class))
        ->toBeTrue();
});

it('allows a user to update their own conversation', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($user->can('update', $conversation))
        ->toBeTrue();
});

it('does not allow a user to update another users conversation', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    expect($otherUser->can('update', $conversation))
        ->toBeFalse();
});

it('allows a user to delete their own conversation', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($user->can('delete', $conversation))
        ->toBeTrue();
});

it('does not allow a user to delete another users conversation', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    expect($otherUser->can('delete', $conversation))
        ->toBeFalse();
});