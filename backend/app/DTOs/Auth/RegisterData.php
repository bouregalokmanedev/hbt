<?php

namespace App\DTOs\Auth;

final readonly class RegisterData
{
    public function __construct(
        public string $first_name,
        public string $last_name,
        public string $username,
        public string $email,
        public string $password,
        public ?string $phone = null,
        public ?string $country = null,
        public string $language = 'en',
        public string $timezone = 'UTC',
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            first_name: $data['first_name'],
            last_name: $data['last_name'],
            username: $data['username'],
            email: $data['email'],
            password: $data['password'],
            phone: $data['phone'] ?? null,
            country: $data['country'] ?? null,
            language: $data['language'] ?? 'en',
            timezone: $data['timezone'] ?? 'UTC',
        );
    }
}