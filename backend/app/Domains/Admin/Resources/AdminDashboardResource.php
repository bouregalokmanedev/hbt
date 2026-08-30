<?php

namespace App\Domains\Admin\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'administrator' => $this->resource['administrator'],
            'modules' => $this->resource['modules'],
            'statistics' => $this->resource['statistics'],
            'meta' => $this->resource['meta'],
        ];
    }
}
