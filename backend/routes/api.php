<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\SessionController;



Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {

     Route::post(
            '/register',
            [AuthController::class, 'register']
        );

        Route::post(
    '/login',
    [AuthController::class, 'login']
);
Route::post(
    '/forgot-password',
    [AuthController::class, 'forgotPassword']
);
Route::post(
    '/reset-password',
    [AuthController::class, 'resetPassword']
);

        Route::middleware('auth:sanctum')->group(function () {

            Route::post('/logout', [AuthController::class, 'logout']);

            Route::get('/me', [AuthController::class, 'me']);

        });

    });

     Route::middleware('auth:sanctum')
        ->prefix('admin')
        ->group(function () {

            Route::apiResource('users', UserController::class);

            Route::patch('users/{user}/restore', [UserController::class, 'restore']);
            Route::patch('users/{user}/activate', [UserController::class, 'activate']);
            Route::patch('users/{user}/suspend', [UserController::class, 'suspend']);
            Route::patch('users/{user}/role', [UserController::class, 'assignRole']);
            Route::patch('users/{user}/password', [UserController::class, 'changePassword']);
        });

});

Route::prefix('sessions')->group(function () {

    Route::get(
        '/',
        [SessionController::class, 'index']
    );

    Route::get(
        '/current',
        [SessionController::class, 'current']
    );

    Route::delete(
        '/others',
        [SessionController::class, 'destroyOthers']
    );

    Route::delete(
        '/{session}',
        [SessionController::class, 'destroy']
    );

});

use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;

Route::get(
    '/verify-email/{id}/{hash}',
    [EmailVerificationController::class, 'verify']
)
->middleware('signed')
->name('verification.verify');


use Illuminate\Http\Request;

Route::get('/v1/debug-auth', function (Request $request) {
    return response()->json([
        'user' => auth()->user(),
        'bearerToken' => $request->bearerToken(),
        'expectsJson' => $request->expectsJson(),
        'accept' => $request->header('Accept'),
        'authorization' => $request->header('Authorization'),
    ]);
})->middleware('auth:sanctum');