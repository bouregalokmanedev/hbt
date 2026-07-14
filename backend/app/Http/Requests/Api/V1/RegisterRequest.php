<?php

namespace App\Http\Requests\Api\V1;

use App\DTOs\Auth\RegisterData;
use App\Http\Requests\Api\BaseApiRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class RegisterRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'first_name' => ['required','string','max:100'],

            'last_name' => ['required','string','max:100'],

            'username' => [
                'required',
                'alpha_dash',
                'min:3',
                'max:30',
                Rule::unique('users'),
            ],

            'email' => [
                'required',
                'email',
                Rule::unique('users'),
            ],

            'password' => [
                'required',
                'confirmed',
                Password::defaults(),
            ],

            'phone' => ['nullable','string'],

            'country' => ['nullable','string'],

            'language' => ['nullable','string'],

            'timezone' => ['nullable','timezone'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim($this->email)),
            'username' => strtolower(trim($this->username)),
        ]);
    }

    public function dto(): RegisterData
    {
        return RegisterData::fromArray(
            $this->validated()
        );
    }
}