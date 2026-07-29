<?php

namespace App\DTOs\Security;

final readonly class DeviceInfo
{
    public function __construct(
        public string $browser,
        public ?string $browserVersion,
        public string $platform,
        public ?string $platformVersion,
        public string $device,
        public string $deviceType,
        public bool $isBot,
    ) {}
}