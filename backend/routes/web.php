<?php

use App\Contracts\Repositories\UserRepositoryInterface;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-repository', function (UserRepositoryInterface $users) {
    return response()->json([
        'count' => $users->all()->count(),
    ]);
});

use App\Contracts\Services\AuthenticationServiceInterface;

Route::get('/test-service', function (
    AuthenticationServiceInterface $auth
) {
    return response()->json([
        'service' => get_class($auth),
    ]);
});
