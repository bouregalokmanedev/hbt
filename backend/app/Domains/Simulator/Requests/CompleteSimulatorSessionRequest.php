<?php

namespace App\Domains\Simulator\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteSimulatorSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->integer('score') > 0 && empty($this->input('steps'))) {
                $validator->errors()->add(
                    'steps',
                    'A scored simulator session must include its procedure steps.',
                );
            }
        });
    }

    public function rules(): array
    {
        return [
            'score' => [
                'required',
                'integer',
                'min:0',
                'max:100',
            ],

            'outcome' => [
                'nullable',
                'string',
                'max:100',
            ],

            'verdict' => [
                'nullable',
                'string',
                'max:255',
            ],

            'attempts' => [
                'sometimes',
                'integer',
                'min:1',
                'max:1000',
            ],

            'hints_used' => [
                'sometimes',
                'integer',
                'min:0',
                'max:1000',
            ],

            'duration_seconds' => [
                'nullable',
                // Accept numeric (not only int) so float seconds from the engine
                // still validate; the service casts to int before persisting.
                'numeric',
                'min:0',
            ],

            'scenario_key' => [
                'nullable',
                'string',
                'max:255',
            ],

            'steps' => [
                'nullable',
                'array',
                'max:500',
            ],

            'metadata' => [
                'nullable',
                'array',
            ],
        ];
    }
}