<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Requests\Api\BaseApiRequest;
use Illuminate\Validation\Rule;

class ChangeUserStatusRequest extends BaseApiRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(UserStatus::class)],
        ];
    }
}
