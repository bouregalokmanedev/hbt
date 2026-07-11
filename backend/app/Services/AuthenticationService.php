<?php

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Contracts\Services\AuthenticationServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\DTOs\Auth\RegisterUserData;

class AuthenticationService implements AuthenticationServiceInterface
{
    public function __construct(
        protected UserRepositoryInterface $users
    ) {}

    public function register(RegisterUserData $data): array
    {
        $user = $this->users->create($data->toArray());

$user->assignRole('Student');

$token = $user->createToken('auth_token')->plainTextToken;

return [
    'user' => $user,
    'token' => $token,
];
    }

    public function login(array $credentials): array
    {
        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}