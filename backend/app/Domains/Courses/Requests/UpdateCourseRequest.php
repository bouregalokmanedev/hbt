<?php

namespace App\Domains\Courses\Requests;

use App\Domains\Courses\DTOs\UpdateCourseData;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('course'));
    }

    public function rules(): array
    {
        $course = $this->route('course');

        return [
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('courses', 'slug')
                    ->ignore($course?->id),
            ],

            'short_description' => [
                'required',
                'string',
                'max:500',
            ],

            'description' => [
                'required',
                'string',
            ],

            'language' => [
                'required',
                'string',
                'max:10',
            ],

            'difficulty' => [
                'required',
                Rule::enum(Difficulty::class),
            ],

            'duration_minutes' => [
                'required',
                'integer',
                'min:0',
            ],

            'price' => [
                'required',
                'integer',
                'min:0',
            ],

            'discount_price' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'currency' => [
                'required',
                'string',
                'size:3',
            ],

            'is_free' => [
                'required',
                'boolean',
            ],

            'visibility' => [
                'required',
                Rule::enum(Visibility::class),
            ],

            'thumbnail' => [
                'nullable',
                'string',
            ],

            'cover_image' => [
                'nullable',
                'string',
            ],

            'preview_video' => [
                'nullable',
                'string',
            ],

            'meta_title' => [
                'nullable',
                'string',
            ],

            'meta_description' => [
                'nullable',
                'string',
            ],

            'metadata' => [
                'nullable',
                'array',
            ],
        ];
    }

    public function toDto(): UpdateCourseData
    {
        $course = $this->route('course');

        return new UpdateCourseData(
            courseId: $course->id,

            title: $this->string('title'),

            slug: $this->string('slug'),

            shortDescription: $this->string('short_description'),

            description: $this->string('description'),

            language: $this->string('language'),

            difficulty: Difficulty::from(
                $this->input('difficulty')
            ),

            durationMinutes: (int) $this->input('duration_minutes'),

            price: (int) $this->input('price'),

            discountPrice: $this->input('discount_price'),

            currency: $this->string('currency'),

            isFree: (bool) $this->boolean('is_free'),

            visibility: Visibility::from(
                $this->input('visibility')
            ),

            thumbnail: $this->input('thumbnail'),

            coverImage: $this->input('cover_image'),

            previewVideo: $this->input('preview_video'),

            metaTitle: $this->input('meta_title'),

            metaDescription: $this->input('meta_description'),

            metadata: $this->input('metadata', []),
        );
    }
}