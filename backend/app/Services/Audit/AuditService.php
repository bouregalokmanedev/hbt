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
        array $metadata = []
    ): void {

        AuditLog::create([

            'user_id' => auth()->id(),

            'event' => $event,

            'auditable_type' => get_class($model),

            'auditable_id' => (string) $model->getKey(),

            'old_values' => $old,

            'new_values' => $new,

            'ip_address' => request()->ip(),

            'user_agent' => request()->userAgent(),

            'metadata' => $metadata,

        ]);

    }
}