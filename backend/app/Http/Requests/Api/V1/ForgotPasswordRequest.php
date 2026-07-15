<?php

namespace App\Http\Requests\Api\V1;

use App\DTOs\Auth\ForgotPasswordData;
use App\Http\Requests\Api\BaseApiRequest;

class ForgotPasswordRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'email' => [
                'required',
                'email',
            ],

        ];
    }

    public function dto(): ForgotPasswordData
    {
        return ForgotPasswordData::fromArray(
            $this->validated()
        );
    }
}