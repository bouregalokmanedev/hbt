<?php

namespace App\Domains\AI\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CreateMentorConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'course_id' => [
                'nullable',
                'string',
            ],

            'title' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}