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
        $name = ['required', 'string', 'max:100', 'regex:/^[\p{L}][\p{L}\s\'’-]*$/u'];

        return [

            'first_name' => $name,

            'last_name' => $name,

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

            // Invite code carried by ?ref= on the signup link.
            'ref' => ['nullable', 'string', 'max:16'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.regex' => 'The first name may only contain letters.',
            'last_name.regex' => 'The last name may only contain letters.',
            'email.unique' => 'This email address is already registered.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim($this->email)),
            'first_name' => trim((string) $this->first_name),
            'last_name' => trim((string) $this->last_name),
        ]);
    }

    public function dto(): RegisterData
    {
        return RegisterData::fromArray(
            $this->validated()
        );
    }
}
