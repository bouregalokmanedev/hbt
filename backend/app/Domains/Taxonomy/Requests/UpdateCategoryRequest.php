<?php

namespace App\Domains\Taxonomy\Requests;

use App\Domains\Taxonomy\DTOs\UpdateCategoryData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can(
            'update',
            $this->route('category')
        );
    }

    public function rules(): array
    {
        $category = $this->route('category');

        return [
            'parent_id' => [
                'sometimes',
                'nullable',
                'uuid',
                'exists:categories,id',
            ],

            'name' => [
                'sometimes',
                'string',
                'max:150',
            ],

            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')
                    ->ignore($category?->id),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'icon' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'color' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'sort_order' => [
                'sometimes',
                'integer',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'metadata' => [
                'sometimes',
                'array',
            ],
        ];
    }

    public function toDto(string $categoryId): UpdateCategoryData
    {
        return new UpdateCategoryData(
            categoryId: $categoryId,
            parentId: $this->input('parent_id'),
            name: $this->input('name'),
            slug: $this->input('slug'),
            description: $this->input('description'),
            icon: $this->input('icon'),
            color: $this->input('color'),
            sortOrder: $this->input('sort_order'),
            isActive: $this->input('is_active'),
            metadata: $this->input('metadata'),
        );
    }
}