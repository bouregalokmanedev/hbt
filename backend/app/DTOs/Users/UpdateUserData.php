<?php

namespace App\DTOs\Users;

final readonly class UpdateUserData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $username,
        public string $email,
        public ?string $phone = null,
        public ?string $country = null,
        public ?string $bio = null,
        public ?string $avatar = null,
        public string $language = 'en',
        public string $timezone = 'UTC',
        public string $status = 'active',
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            firstName: trim($data['first_name']),
            lastName: trim($data['last_name']),
            username: strtolower(trim($data['username'])),
            email: strtolower(trim($data['email'])),
            phone: $data['phone'] ?? null,
            country: $data['country'] ?? null,
            bio: $data['bio'] ?? null,
            avatar: $data['avatar'] ?? null,
            language: $data['language'] ?? 'en',
            timezone: $data['timezone'] ?? config('app.timezone'),
            status: $data['status'] ?? 'active',
        );
    }

    public function toArray(): array
    {
        return [
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'bio' => $this->bio,
            'avatar' => $this->avatar,
            'language' => $this->language,
            'timezone' => $this->timezone,
            'status' => $this->status,
        ];
    }
}