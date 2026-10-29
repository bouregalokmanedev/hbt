<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

/**
 * Look up a registered route by its URI and HTTP verb.
 *
 * @return array<int, string>
 */
function routeMiddleware(string $uri, string $method = 'GET'): array
{
    /** @var RoutingRoute|null $route */
    $route = collect(Route::getRoutes()->getRoutes())->first(
        fn (RoutingRoute $candidate): bool => $candidate->uri() === $uri
            && in_array($method, $candidate->methods(), true),
    );

    expect($route)->not->toBeNull();

    return $route->gatherMiddleware();
}

it('requires a verified email on learner, assessment, payment, and messaging routes', function () {
    $protected = [
        ['api/courses/{course}/progress', 'GET'],
        ['api/courses/{course}/progress/sync', 'POST'],
        ['api/v1/quizzes/{quiz}', 'GET'],
        ['api/v1/quizzes/{quiz}/attempts', 'POST'],
        ['api/v1/mentor/conversations', 'GET'],
        ['api/v1/assessments', 'GET'],
        ['api/v1/student/assessments/{assessment}/attempts', 'POST'],
        ['api/v1/enrollments', 'GET'],
        ['api/v1/checkout', 'POST'],
        ['api/v1/messages/conversations', 'GET'],
        ['api/v1/notifications', 'GET'],
    ];

    foreach ($protected as [$uri, $method]) {
        $middleware = routeMiddleware($uri, $method);

        expect(in_array('verified', $middleware, true))
            ->toBeTrue("Expected {$method} {$uri} to require a verified email.");
    }
});

it('keeps account, verification, locale, phone, and session routes usable before verification', function () {
    $intentional = [
        ['api/v1/auth/me', 'GET'],
        ['api/v1/auth/logout', 'POST'],
        ['api/v1/auth/profile', 'PATCH'],
        ['api/v1/auth/locale', 'PATCH'],
        ['api/v1/auth/email/resend', 'POST'],
        ['api/v1/auth/email/resend-unverified', 'POST'],
        ['api/v1/auth/phone/otp/send', 'POST'],
        ['api/v1/auth/phone/otp/verify', 'POST'],
        ['api/sessions', 'GET'],
        ['api/sessions/current', 'GET'],
    ];

    foreach ($intentional as [$uri, $method]) {
        $middleware = routeMiddleware($uri, $method);

        expect(in_array('verified', $middleware, true))
            ->toBeFalse("{$method} {$uri} must stay available before email verification.");
    }
});

it('returns 403 from a verified-only endpoint for an unverified account', function () {
    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)
        ->getJson('/api/v1/notifications')
        ->assertForbidden()
        ->assertJsonPath('message', 'Your email address is not verified.');
});

it('lets a verified account use the same endpoint', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->getJson('/api/v1/notifications')
        ->assertOk();
});

it('serves the account and session endpoints to an unverified account', function () {
    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email);

    $this->actingAs($user)
        ->getJson('/api/sessions')
        ->assertOk();
});

it('does not block the public catalog and preview lesson endpoints on verification', function () {
    expect(in_array('verified', routeMiddleware('api/v1/catalog/courses'), true))
        ->toBeFalse()
        ->and(in_array('verified', routeMiddleware('api/v1/lessons/{lesson}'), true))
        ->toBeFalse();
});
