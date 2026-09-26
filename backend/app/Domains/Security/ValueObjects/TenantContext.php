<?php

namespace App\Domains\Security\ValueObjects;

use App\Models\User;

final readonly class TenantContext
{
    public function __construct(
        public ?string $tenantId,
        public ?int $userId,
    ) {}

    public static function fromUser(?User $user): self
    {
        return new self(
            tenantId: $user?->tenant_id ?? null,
            userId: $user?->id,
        );
    }

    public function isTenantScoped(): bool
    {
        return $this->tenantId !== null;
    }

    /**
     * @param array<string,mixed> $attributes
     * @return array<string,mixed>
     */
    public function scopeAttributes(array $attributes): array
    {
        if ($this->tenantId !== null && ! array_key_exists('tenant_id', $attributes)) {
            $attributes['tenant_id'] = $this->tenantId;
        }
        return $attributes;
    }
}
