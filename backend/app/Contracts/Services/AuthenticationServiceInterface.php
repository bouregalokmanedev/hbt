<?php

namespace App\Contracts\Services;

use App\Models\User;

interface AuthenticationServiceInterface
{
    public function register(array $data): array;

    public function login(string $email, string $password): array;

    public function logout(User $user): void;

    public function me(User $user): User;
}