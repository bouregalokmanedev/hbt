<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\AuthenticationServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use App\DTOs\Auth\RegisterUserData;

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

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully.',
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ]);
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }
}