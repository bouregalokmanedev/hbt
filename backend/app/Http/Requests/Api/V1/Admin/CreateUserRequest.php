<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use App\DTOs\Users\CreateUserData;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check()
            && auth()->user()->hasAnyRole([
                UserRole::SUPER_ADMIN->value,
                UserRole::ADMIN->value,
            ]);
    }

    public function rules(): array
    {
        return [

            'first_name' => [
                'required',
                'string',
                'max:100',
            ],

            'last_name' => [
                'required',
                'string',
                'max:100',
            ],

            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'alpha_dash',
                Rule::unique('users'),
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users'),
            ],

            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'language' => [
                'nullable',
                'string',
                'max:10',
            ],

            'timezone' => [
                'nullable',
                'timezone',
            ],

            'status' => [
                'nullable',
                Rule::enum(\App\Enums\UserStatus::class)
            ],

        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([

            'email' => strtolower(trim($this->email)),

            'username' => strtolower(trim($this->username)),

            'first_name' => trim($this->first_name),

            'last_name' => trim($this->last_name),

        ]);
    }

    public function messages(): array
    {
        return [

            'username.unique' =>
                'This username is already taken.',

            'email.unique' =>
                'This email address already exists.',

            'password.confirmed' =>
                'Password confirmation does not match.',

        ];
    }
}