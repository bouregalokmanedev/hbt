<?php

namespace App\DTOs\Auth;

final readonly class ResetPasswordData
{
    public function __construct(
        public string $email,
        public string $token,
        public string $password,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            email: strtolower($data['email']),
            token: $data['token'],
            password: $data['password'],
        );
    }
}