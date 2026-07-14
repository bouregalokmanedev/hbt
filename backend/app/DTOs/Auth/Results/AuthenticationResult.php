<?php

namespace App\DTOs\Auth\Results;

use App\Models\User;
use Carbon\CarbonInterface;

final readonly class AuthenticationResult
{
    public function __construct(
        public User $user,
        public string $token,
        public string $tokenType = 'Bearer',
        public ?CarbonInterface $expiresAt = null,
    ) {}
}