<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\DTOs\Users\UpdateUserData;
use App\Http\Requests\Api\BaseApiRequest;
use Illuminate\Validation\Rule;


class UpdateProfileRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $user = auth()->user();

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
                'alpha_dash',
                'min:3',
                'max:30',
                Rule::unique('users')
                    ->ignore($user->id),
            ],

            /*
             * Email is intentionally excluded.
             *
             * Students cannot change their email
             * from the profile page.
             */

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

            'bio' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'avatar' => [
                'nullable',
                'url',
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
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => trim(
                (string) $this->first_name
            ),

            'last_name' => trim(
                (string) $this->last_name
            ),

            'username' => strtolower(
                trim((string) $this->username)
            ),

            'phone' => $this->phone
                ? trim($this->phone)
                : null,

            'country' => $this->country
                ? trim($this->country)
                : null,

            'bio' => $this->bio
                ? trim($this->bio)
                : null,
        ]);
    }

    public function dto(): UpdateUserData
    {
        return UpdateUserData::fromArray(
            $this->validated()
        );
    }
}