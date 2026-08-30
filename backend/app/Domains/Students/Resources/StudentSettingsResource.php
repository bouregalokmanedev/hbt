<?php

namespace App\Domains\Students\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'account' => $this['account'],

            'appearance' => $this['appearance'],

            'notifications' => $this['notifications'],

            'privacy' => $this['privacy'],

            'learning' => $this['learning'],
            'security' => $this['security'],
            'assessment' => $this['assessment'],
        ];
    }
}
