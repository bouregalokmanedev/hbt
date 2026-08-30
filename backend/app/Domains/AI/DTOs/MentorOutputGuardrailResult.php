<?php

namespace App\Domains\AI\DTOs;

final readonly class MentorOutputGuardrailResult
{
    public function __construct(
        public bool $allowed,
        public string $action,
        public ?string $reason = null,
        public ?string $safeResponse = null,
    ) {
    }

    public static function allow(): self
    {
        return new self(
            allowed: true,
            action: 'allow',
        );
    }

    public static function block(
        string $reason,
        ?string $safeResponse = null,
    ): self {
        return new self(
            allowed: false,
            action: 'block',
            reason: $reason,
            safeResponse: $safeResponse,
        );
    }

    public static function review(
        string $reason,
    ): self {
        return new self(
            allowed: false,
            action: 'review',
            reason: $reason,
        );
    }
}