<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Admin\UserController;



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

        Route::middleware('auth:sanctum')->group(function () {

            Route::post('/logout', [AuthController::class, 'logout']);

            Route::get('/me', [AuthController::class, 'me']);

        });

    });

});

Route::middleware([
    'auth:sanctum'
])->prefix('admin')->group(function () {

    Route::apiResource(
        'users',
        UserController::class
    );

    Route::patch(
        'users/{user}/restore',
        [UserController::class,'restore']
    );

    Route::patch(
        'users/{user}/activate',
        [UserController::class,'activate']
    );

    Route::patch(
        'users/{user}/suspend',
        [UserController::class,'suspend']
    );

    Route::patch(
        'users/{user}/role',
        [UserController::class,'assignRole']
    );

    Route::patch(
        'users/{user}/password',
        [UserController::class,'changePassword']
    );

});


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