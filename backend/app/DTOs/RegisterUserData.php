<?php

namespace App\DTOs\Auth;


final readonly class RegisterUserData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $username,
        public string $email,
        public string $password,
        public ?string $phone = null,
        public ?string $country = null,
        public string $language = 'en',
        public string $timezone = 'UTC'
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            firstName: trim($data['first_name']),
            lastName: trim($data['last_name']),
            username: strtolower(trim($data['username'])),
            email: strtolower(trim($data['email'])),
            password: $data['password'],
            phone: $data['phone'] ?? null,
            country: $data['country'] ?? null,
            language: $data['language'] ?? 'en',
            timezone: $data['timezone'] ?? config('app.timezone'),
        );
    }

    public function toArray(): array
    {
        return [
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'username' => $this->username,
            'email' => $this->email,
            'password' => $this->password,
            'phone' => $this->phone,
            'country' => $this->country,
            'language' => $this->language,
            'timezone' => $this->timezone,
            'status' => 'active',
        ];
    }
}