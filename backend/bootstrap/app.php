<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use App\Domains\Taxonomy\Exceptions\CircularCategoryHierarchyException;
use App\Domains\Taxonomy\Exceptions\InactiveParentCategoryException;
use App\Domains\Taxonomy\Exceptions\CannotDeleteRootCategoryException;
use App\Domains\Taxonomy\Exceptions\CategoryHasChildrenException;
use App\Domains\Taxonomy\Exceptions\CategoryHasCoursesException;
use App\Domains\Taxonomy\Exceptions\CategoryNotFoundException;
use App\Domains\Taxonomy\Exceptions\CourseNotFoundException;
use App\Domains\Courses\Exceptions\SectionCannotBePublished;
use App\Domains\Courses\Exceptions\CourseCannotBePublishedException;
use App\Domains\Courses\Exceptions\CourseAlreadyPublishedException;
use App\Domains\Courses\Exceptions\CourseArchivedException;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use App\Http\Middleware\UpdateSessionActivity;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'role' => RoleMiddleware::class,
        'permission' => PermissionMiddleware::class,
        'role_or_permission' => RoleOrPermissionMiddleware::class,
    ]);

    $middleware->appendToGroup('api', [
        UpdateSessionActivity::class,
    ]);
})

    ->withExceptions(function (Exceptions $exceptions): void {

        /*
        |--------------------------------------------------------------------------
        | API JSON responses
        |--------------------------------------------------------------------------
        */

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*')
        );

        /*
        |--------------------------------------------------------------------------
        | Authentication
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            AuthenticationException $e,
            Request $request
        ) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Taxonomy domain exceptions
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
    CircularCategoryHierarchyException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});

$exceptions->render(function (
    CourseCannotBePublishedException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});

$exceptions->render(function (
    InactiveParentCategoryException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});
$exceptions->render(function (
    DomainException $e,
    Request $request
) {
    if ($request->is('api/*')) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], 422);
    }
});
$exceptions->render(function (
    CourseAlreadyPublishedException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 409);
});
$exceptions->render(function (
    ParentCategoryNotFoundException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});
$exceptions->render(function (
    CourseArchivedException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});
$exceptions->render(function (
    CannotDeleteRootCategoryException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 409);
});

$exceptions->render(function (
    CategoryHasChildrenException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 409);
});

$exceptions->render(function (
    CategoryHasCoursesException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 409);
});

$exceptions->render(function (
    CategoryNotFoundException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});
$exceptions->render(function (
    CourseNotFoundException $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});
$exceptions->render(function (
    SectionCannotBePublished $e
) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
});
    })

    ->create();