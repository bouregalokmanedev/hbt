<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    public function log(
        string $event,
        Model $model,
        array $old = [],
        array $new = [],
        array $metadata = [],
        ?int $actorId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): void {
        AuditLog::create([
            'user_id' => $actorId ?? auth()->id(),

            'event' => $event,

            'auditable_type' => get_class($model),

            'auditable_id' => (string) $model->getKey(),

            'old_values' => $old ?: null,

            'new_values' => $new ?: null,

            'ip_address' => $ipAddress ?? request()->ip(),

            'user_agent' => $userAgent ?? request()->userAgent(),

            'metadata' => $metadata ?: null,
        ]);
    }
}
