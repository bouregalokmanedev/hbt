<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\DTOs\Users\UpdateUserData;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Requests\Api\BaseApiRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends BaseApiRequest
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
        $user = $this->route('user');

        return [

            'first_name' => ['required','string','max:100'],

            'last_name' => ['required','string','max:100'],

            'username' => [
                'required',
                'string',
                'alpha_dash',
                'min:3',
                'max:30',
                Rule::unique('users')
                    ->ignore($user),
            ],

            'email' => [
                'required',
                'email',
                Rule::unique('users')
                    ->ignore($user),
            ],

            'phone' => ['nullable','string','max:30'],

            'country' => ['nullable','string','max:100'],

            'bio' => ['nullable','string','max:5000'],

            'avatar' => ['nullable','url'],

            'language' => ['nullable','string','max:10'],

            'timezone' => ['nullable','timezone'],

            'status' => [
                'nullable',
                Rule::enum(UserStatus::class),
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

    public function dto(): UpdateUserData
    {
        return UpdateUserData::fromArray(
            $this->validated()
        );
    }
}