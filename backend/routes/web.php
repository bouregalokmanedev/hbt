<?php

use App\Contracts\Repositories\UserRepositoryInterface;

Route::get('/test-repository', function (UserRepositoryInterface $users) {
    return response()->json([
        'count' => $users->all()->count(),
    ]);
});

