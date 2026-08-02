<?php

namespace App\Domains\Taxonomy\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'parent_id' => $this->parent_id,

            'name' => $this->name,

            'slug' => $this->slug,

            'description' => $this->description,

            'icon' => $this->icon,

            'color' => $this->color,

            'sort_order' => $this->sort_order,

            'is_active' => $this->is_active,

            'metadata' => $this->metadata,

            'children_count' => $this->whenCounted('children'),

            'courses_count' => $this->whenCounted('courses'),

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

        ];
    }
}