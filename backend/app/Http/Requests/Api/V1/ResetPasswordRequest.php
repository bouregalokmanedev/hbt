<?php

namespace App\Http\Requests\Api\V1;

use App\DTOs\Auth\ResetPasswordData;
use App\Http\Requests\Api\BaseApiRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'email' => ['required','email'],

            'token' => ['required','string'],

            'password' => [
                'required',
                'confirmed',
                Password::defaults(),
            ],

        ];
    }

    public function dto(): ResetPasswordData
    {
        return ResetPasswordData::fromArray(
            $this->validated()
        );
    }
}