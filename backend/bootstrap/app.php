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
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

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
        SetLocale::class,
        UpdateSessionActivity::class,
        SecurityHeaders::class,
    ]);

    // Global API throttle — per-route throttles can still be stricter.
    $middleware->throttleApi();

    $middleware->redirectGuestsTo(
        fn (Request $request) => $request->is('api/*')
            ? null
            : '/login',
    );
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

        /*
        |--------------------------------------------------------------------------
        | Student assessments
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            \App\Domains\StudentAssessments\Exceptions\AssessmentAccessDeniedException $e
        ) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        });

        $exceptions->render(function (
            \App\Domains\StudentAssessments\Exceptions\AttemptAlreadySubmittedException $e
        ) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 409);
        });

        $exceptions->render(function (
            \App\Domains\Assessments\Exceptions\AssessmentNotEligibleException $e
        ) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'evidence' => $e->evidence,
            ], 422);
        });

        $exceptions->render(function (
            \App\Domains\Assessments\Exceptions\AssessmentMaxAttemptsExceededException $e
        ) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        });

        /*
        |--------------------------------------------------------------------------
        | App\Core\Domain\Exceptions\DomainException
        |--------------------------------------------------------------------------
        | The handler above only catches PHP's own \DomainException. Half the
        | modules throw App\Core's base class instead, so without this they
        | fall through to the 500 below.
        */

        $exceptions->render(function (
            \App\Core\Domain\Exceptions\DomainException $e,
            Request $request
        ) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return null;
        });

        /*
        |--------------------------------------------------------------------------
        | api/* safety net
        |--------------------------------------------------------------------------
        | Registered last on purpose: render callbacks run in registration
        | order and the first non-null response wins, so every specific
        | renderer above keeps priority.
        |
        | Nothing that reaches here may echo an exception message, SQL, a file
        | path or a class name back to the client, whatever APP_DEBUG says.
        | Exceptions Laravel resolves itself (validation, auth, redirects) are
        | left untouched, and abort() keeps its hand-written message.
        */

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof \Illuminate\Http\Exceptions\HttpResponseException
                || $e instanceof AuthenticationException
                || $e instanceof \Illuminate\Auth\Access\AuthorizationException
            ) {
                return null;
            }

            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                // Implicit route model binding names the internal class + ids.
                if (str_contains((string) $e->getMessage(), 'No query results for model')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Resource not found.',
                    ], 404);
                }

                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong.',
            ], 500);
        });
    })
    ->create();
