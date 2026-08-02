<?php

namespace App\Domains\Taxonomy\Requests;

use App\Domains\Taxonomy\DTOs\CreateCategoryData;
use Illuminate\Foundation\Http\FormRequest;

class CreateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can(
            'create',
            \App\Models\Category::class
        );
    }

    public function rules(): array
    {
        return [

            'parent_id'=>[
                'nullable',
                'uuid',
                'exists:categories,id'
            ],

            'name'=>[
                'required',
                'string',
                'max:150'
            ],

            'slug'=>[
                'required',
                'string',
                'unique:categories'
            ],

            'description'=>[
                'nullable',
                'string'
            ],

            'icon'=>[
                'nullable',
                'string'
            ],

            'color'=>[
                'nullable',
                'string'
            ],

            'sort_order'=>[
                'integer'
            ],

            'is_active'=>[
                'boolean'
            ],

            'metadata'=>[
                'array'
            ],

        ];
    }

    public function toDto(): CreateCategoryData
    {
        return new CreateCategoryData(

            parentId: $this->input('parent_id'),

            name: $this->string('name')->toString(),

            slug: $this->string('slug')->toString(),

            description: $this->input('description'),

            icon: $this->input('icon'),

            color: $this->input('color'),

            sortOrder: (int)$this->input('sort_order',0),

            isActive: $this->boolean('is_active',true),

            metadata: $this->input('metadata',[]),

        );
    }
}