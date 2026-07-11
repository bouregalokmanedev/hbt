<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'bio' => $this->bio,
            'country' => $this->country,
            'language' => $this->language,
            'timezone' => $this->timezone,
            'status' => $this->status,
            'roles' => $this->getRoleNames(),
            'created_at' => $this->created_at,
        ];
    }
}