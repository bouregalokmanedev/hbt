<?php

namespace App\Http\Resources\Api\V1\Auth;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'user' => new UserResource($this->user),

            'token' => $this->token,

            'token_type' => $this->tokenType,

            'expires_at' => $this->expiresAt,

        ];
    }
}