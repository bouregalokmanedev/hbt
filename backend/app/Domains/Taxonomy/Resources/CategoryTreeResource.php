<?php

namespace App\Domains\Taxonomy\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryTreeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id'=>$this->id,

            'name'=>$this->name,

            'slug'=>$this->slug,

            'children'=>

                CategoryTreeResource

                    ::collection(

                        $this->whenLoaded(

                            'children'

                        )

                    ),

        ];
    }
}