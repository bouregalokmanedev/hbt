<?php

namespace App\Domains\AI\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SendMentorMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'min:1',
            ],
        ];
    }
}