<?php

namespace App\Domains\Admin\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminSystemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}
