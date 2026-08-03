<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\LessonController;



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

Route::middleware([
    'auth:sanctum',
    'verified',
])->prefix('v1')->group(function () {

 Route::post(
            '/sections',
            [SectionController::class, 'store']
        );

        Route::patch(
            '/sections/{section}',
            [SectionController::class, 'update']
        );

        Route::delete(
            '/sections/{section}',
            [SectionController::class, 'destroy']
        );

        Route::post(
            '/sections/{section}/publish',
            [SectionController::class, 'publish']
        );

        Route::post(
            '/sections/{section}/unpublish',
            [SectionController::class, 'unpublish']
        );

        Route::post(
            '/sections/{section}/reorder',
            [SectionController::class, 'reorder']
        );
        Route::post(
    '/lessons',
    [LessonController::class, 'store']
);

Route::patch(
    '/lessons/{lesson}',
    [LessonController::class, 'update']
);

Route::delete(
    '/lessons/{lesson}',
    [LessonController::class, 'destroy']
);

Route::post(
    '/lessons/{lesson}/publish',
    [LessonController::class, 'publish']
);

Route::post(
    '/lessons/{lesson}/unpublish',
    [LessonController::class, 'unpublish']
);

Route::post(
    '/lessons/{lesson}/reorder',
    [LessonController::class, 'reorder']
);

Route::get(
    'courses/{course}/curriculum',
    [CourseController::class, 'curriculum']
)->name('courses.curriculum');

    Route::apiResource(
        'courses',
        CourseController::class
    );
    Route::post(
    'courses/{course}/publish',
    [CourseController::class, 'publish']
);

});

Route::middleware('auth:sanctum')
    ->prefix('sessions')
    ->group(function () {

        Route::get('/', [SessionController::class, 'index']);

        Route::get('/current', [SessionController::class, 'current']);

        Route::delete('/others', [SessionController::class, 'destroyOthers']);

        Route::delete('/{session}', [SessionController::class, 'destroy']);

    });

use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;

Route::get(
    '/verify-email/{id}/{hash}',
    [EmailVerificationController::class, 'verify']
)
->middleware('signed')
->name('verification.verify');

use App\Http\Controllers\Api\V1\CategoryController;

Route::middleware([
    'auth:sanctum',
    'verified',
])->prefix('v1')->group(function () {

    

        route::get(
            'categories/roots',
            [CategoryController::class, 'roots']
        )->name('categories.roots');
        route::get(
            'categories/leaves',
            [CategoryController::class, 'leaves']
        )->name('categories.leaves');
        route::get(
            'categories/active',
            [CategoryController::class, 'active']
        )->name('categories.active');
        route::get(
            'categories/inactive',
            [CategoryController::class, 'inactive']
        )->name('categories.inactive');
        route::get(
            'categories/tree',
            [CategoryController::class, 'tree']
        )->name('categories.tree');
        route::get(
    'categories/{category}/breadcrumb',
    [CategoryController::class, 'breadcrumb']
)->name('categories.breadcrumb');

        route::post(
            'categories/attach',
            [CategoryController::class, 'attach']
        )->name('categories.attach');
       route::delete(
    '/categories/detach',
    [CategoryController::class, 'detach']
)->name('categories.detach');

        route::get(
            'categories/{category}/courses',
            [CategoryController::class, 'courses']
        )->name('categories.courses');
        route::get(
            'categories/{category}/children',
            [CategoryController::class, 'children']
        )->name('categories.children');
        route::get(
            'categories/{category}/ancestors',
            [CategoryController::class, 'ancestors']
        )->name('categories.ancestors');
        route::get(
            'categories/{category}/descendants',
            [CategoryController::class, 'descendants']
        )->name('categories.descendants');
        route::get(
            'categories/{category}/siblings',
            [CategoryController::class, 'siblings']
        )->name('categories.siblings');
        route::get(
            'categories/{category}/parent',
            [CategoryController::class, 'parent']
        )->name('categories.parent');
        route::get(
            'categories/{category}/root',
            [CategoryController::class, 'root']
        )->name('categories.root');
        route::get(
            'categories/{category}/is-root',
            [CategoryController::class, 'isRoot']
        )->name('categories.is-root');
        route::get(
            'categories/{category}/is-leaf',
            [CategoryController::class, 'isLeaf']
        )->name('categories.is-leaf');
        route::get(
            'categories/{category}/is-ancestor-of/{otherCategory}',
            [CategoryController::class, 'isAncestorOf']
        )->name('categories.is-ancestor-of');

        Route::apiResource('categories', CategoryController::class)
        ->only([
            'index',
            'store',
            'show',
            'update',
            'destroy',
        ]);

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