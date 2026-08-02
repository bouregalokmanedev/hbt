<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'device_name' => $this->device_name,
            'browser' => $this->browser,
            'platform' => $this->platform,
            'device_type' => $this->device_type,
            'ip_address' => $this->ip_address,
            'logged_in_at' => $this->logged_in_at,
            'last_activity_at' => $this->last_activity_at,
            'logged_out_at' => $this->logged_out_at,
            'is_current' => $this->is_current,
        ];
    }
}