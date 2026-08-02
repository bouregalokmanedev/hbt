<?php

namespace App\Domains\Taxonomy\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Domains\Taxonomy\DTOs\DetachCategoryFromCourseData;

class DetachCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'uuid'],
            'course_id' => ['required', 'uuid'],
        ];
    }

    public function toDto(): DetachCategoryFromCourseData
    {
        return new DetachCategoryFromCourseData(
            courseId: $this->string('course_id')->toString(),
            categoryId: $this->string('category_id')->toString(),
            performedBy: (string) $this->user()->id,
        );
    }
}