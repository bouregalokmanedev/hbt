<?php

namespace App\DTOs\Auth;

final readonly class ForgotPasswordData
{
    public function __construct(
        public string $email,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            strtolower($data['email'])
        );
    }
}