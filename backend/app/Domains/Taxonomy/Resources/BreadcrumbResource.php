<?php

namespace App\Domains\Taxonomy\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BreadcrumbResource extends JsonResource
{
    public function toArray($request)
    {
        return [

            'id'=>$this->id,

            'name'=>$this->name,

            'slug'=>$this->slug,

        ];
    }
}