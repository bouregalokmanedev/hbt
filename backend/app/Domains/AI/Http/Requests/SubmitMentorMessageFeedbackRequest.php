<?php

namespace App\Domains\AI\Http\Requests;

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class SubmitMentorMessageFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'rating' => [
                'required',
                Rule::enum(MentorFeedbackRating::class),
            ],

            'reason' => [
                'nullable',
                Rule::enum(MentorFeedbackReason::class),
            ],

            'comment' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'metadata' => [
                'nullable',
                'array',
            ],
        ];
    }
}