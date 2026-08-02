<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('allows an instructor to create a course', function () {

    $user = User::factory()->create();

    $user->assignRole('Instructor');

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/courses', [

        'title' => 'Laravel Masterclass',

        'slug' => 'laravel-masterclass',

        'short_description' => 'Learn Laravel',

        'description' => 'Complete Laravel course',

        'language' => 'en',

        'difficulty' => 'beginner',

        'duration_minutes' => 600,

        'price' => 9900,

        'currency' => 'USD',

        'is_free' => false,

        'visibility' => 'private',

    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('courses', [

        'slug' => 'laravel-masterclass',

    ]);

});