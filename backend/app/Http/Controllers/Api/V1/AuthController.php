<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\AuthenticationServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use App\DTOs\Auth\RegisterUserData;
use App\Support\ApiResponse;

class AuthController extends Controller
{
    public function __construct(
        protected AuthenticationServiceInterface $authService
    ) {}

    public function register(RegisterRequest $request)
    {
        $dto = RegisterUserData::fromArray(
    $request->validated()
);

$result = $this->authService->register($dto);

        return $this->success(
    [
        'user' => new UserResource($result['user']),
        'token' => $result['token'],
    ],
    'User registered successfully.',
    201
);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());

        return $this->success(
    [
        'user' => new UserResource($result['user']),
        'token' => $result['token'],
    ],
    'Login successful.'
);
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request->user());

        return $this->success(
    null,
    'Logged out successfully.'
);
    }

    public function me(Request $request)
    {
        return $this->success(
    new UserResource($request->user())
);
    }
}