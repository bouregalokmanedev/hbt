<?php

namespace App\DTOs\Users;

final readonly class ChangePasswordData
{
    public function __construct(
        public string $currentPassword,
        public string $newPassword,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            currentPassword: $data['current_password'],
            newPassword: $data['password'],
        );
    }
}