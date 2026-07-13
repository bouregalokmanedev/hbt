<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Api\BaseApiRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [

            'password' => [
                'required',
                'confirmed',
                Password::defaults(),
            ],

        ];
    }
}