<?php

namespace App\Support;

final readonly class ActionResult
{
    public function __construct(
        public bool $success,
        public mixed $data = null,
        public ?string $message = null,
        public ?array $errors = null,
    ) {}

    public static function success(
        mixed $data = null,
        ?string $message = null,
    ): self {
        return new self(
            success: true,
            data: $data,
            message: $message,
        );
    }

    public static function failure(
        string $message,
        ?array $errors = null,
    ): self {
        return new self(
            success: false,
            data: null,
            message: $message,
            errors: $errors,
        );
    }
}