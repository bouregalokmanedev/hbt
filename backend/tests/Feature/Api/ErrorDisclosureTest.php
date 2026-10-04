<?php

use App\Domains\AI\Models\MentorConversation;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

beforeEach(function () {
    Route::middleware('api')->get('/api/v1/_error-probe/failure', function () {
        throw new RuntimeException(
            'SQLSTATE[42P01] relation "secrets" does not exist '
            .'(Connection: pgsql, Host: db.internal, Port: 5432, Database: hbtronics) '
            .'/var/www/app/Models/Secret.php:88'
        );
    });

    Route::middleware('api')->get('/api/v1/_error-probe/missing/{conversation}', function (MentorConversation $conversation) {
        return response()->json(['id' => $conversation->id]);
    });
});

it('never returns exception internals from an unhandled api failure', function () {
    $response = $this->getJson('api/v1/_error-probe/failure');

    $response->assertStatus(500)
        ->assertJson(['success' => false, 'message' => 'Something went wrong.'])
        ->assertJsonMissingPath('exception')
        ->assertJsonMissingPath('file')
        ->assertJsonMissingPath('line')
        ->assertJsonMissingPath('trace');

    expect($response->getContent())
        ->not->toContain('SQLSTATE')
        ->not->toContain('db.internal')
        ->not->toContain('Secret.php')
        ->not->toContain('RuntimeException');
});

it('never names the model class when a route model binding misses', function () {
    $response = $this->getJson('/api/v1/_error-probe/missing/'.Str::uuid());

    $response->assertStatus(404)
        ->assertJson(['success' => false, 'message' => 'Resource not found.']);

    expect($response->getContent())
        ->not->toContain('MentorConversation')
        ->not->toContain('App\\Domains');
});
