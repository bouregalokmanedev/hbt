<?php

namespace App\Contracts\Services;

use App\DTOs\Auth\RegisterUserData;
use App\Models\User;

interface AuthenticationServiceInterface
{
    public function register(RegisterUserData $data): array;

    public function login(array $credentials): array;

    public function logout(User $user): void;
}