<?php

namespace App\Http\Requests\Api\V1;
use App\DTOs\Auth\LoginData;
use App\Http\Requests\Api\BaseApiRequest;

class LoginRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'email' => ['required', 'email'],

            'password' => ['required', 'string'],

            'remember' => ['sometimes', 'boolean'],

        ];
    }

    public function dto(): LoginData
    {
        return LoginData::fromArray(
            $this->validated()
        );
    }
}