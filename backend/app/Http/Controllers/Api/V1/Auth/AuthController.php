<?php

namespace App\Http\Controllers\Api\V1\Auth;


use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RegisterRequest;
use App\Http\Resources\Api\V1\Auth\AuthResource;
use App\Http\Responses\ApiResponse;
use App\Services\Authentication\AuthenticationService;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;


class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AuthenticationService $auth,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->auth->register(
            $request->dto()
        );

        if (! $result->success) {
            return $this->error(
                $result->message,
                422,
                $result->errors ?? []
            );
        }

        return $this->success(
            new AuthResource($result->data),
            $result->message,
            201
        );
    }

    public function login(LoginRequest $request): JsonResponse
{
    $result = $this->auth->login(
        $request->dto()
    );

    if (! $result->success) {
        return $this->error(
            $result->message,
            401
        );
    }

    return $this->success(
        new AuthResource($result->data),
        $result->message
    );
}

public function logout(): JsonResponse
{
    $result = $this->auth->logout();

    return $this->success(
        null,
        $result->message
    );
}
public function me(): JsonResponse
{
    return $this->success(
        new UserResource(auth()->user())
    );
}
}