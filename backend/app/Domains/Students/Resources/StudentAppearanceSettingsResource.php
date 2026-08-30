<?php

namespace App\Domains\Students\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentAppearanceSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'appearance' => $this->appearance,
            'theme' => $this->theme,
            'compact_mode' => $this->compact_mode,
            'reduced_motion' => $this->reduced_motion,
        ];
    }
}