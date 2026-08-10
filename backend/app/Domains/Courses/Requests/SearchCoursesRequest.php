<?php

namespace App\Domains\Courses\Requests;

use App\Enums\Courses\Difficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchCoursesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => [
                'nullable',
                'string',
                'max:255',
            ],

            'difficulty' => [
                'nullable',
                Rule::enum(Difficulty::class),
            ],

            'free' => [
                'nullable',
                'boolean',
            ],

            'language' => [
                'nullable',
                'string',
                'max:10',
            ],

            'sort' => [
                'nullable',
                Rule::in([
                    'created_at',
                    'updated_at',
                    'title',
                    'duration_minutes',
                    'price',
                ]),
            ],

            'direction' => [
                'nullable',
                Rule::in([
                    'asc',
                    'desc',
                ]),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }
}