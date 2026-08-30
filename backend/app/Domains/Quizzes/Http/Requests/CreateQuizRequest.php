<?php

namespace App\Domains\Quizzes\Http\Requests;

use App\Domains\Quizzes\Enums\QuizQuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Domains\Quizzes\Enums\QuizStatus;
use Illuminate\Validation\Rules\Enum;



final class CreateQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'section_id' => [
                'required',
                'string',
                'exists:sections,id',
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'position' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'status' => [
    'nullable',
    'string',
    new Enum(QuizStatus::class),
],

            'pass_percentage' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],

            'max_attempts' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'time_limit' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'questions' => [
                'nullable',
                'array',
            ],

            'questions.*.question' => [
                'required',
                'string',
            ],

            'questions.*.type' => [
                'required',
                'string',
                Rule::enum(QuizQuestionType::class),
            ],

            'questions.*.position' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'questions.*.points' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'questions.*.required' => [
                'nullable',
                'boolean',
            ],

            'questions.*.options' => [
    'required',
    'array',
    'min:1',
],

            'questions.*.options.*.option' => [
                'required',
                'string',
            ],

            'questions.*.options.*.position' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'questions.*.options.*.is_correct' => [
                'nullable',
                'boolean',
            ],
        ];
    }
}