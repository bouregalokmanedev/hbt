<?php

namespace App\Domains\Bootcamps\Requests;

use App\Enums\Bootcamps\BootcampPaymentMethod;
use App\Enums\Bootcamps\BootcampSite;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreBootcampRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:40'],
            'schedule_id' => ['required', 'uuid', 'exists:bootcamp_schedules,id'],
            'site' => ['required', Rule::enum(BootcampSite::class)],
            'payment_method' => [
                'required',
                Rule::enum(BootcampPaymentMethod::class),
            ],
            'terms_accepted' => ['accepted'],
            'turnstile_token' => ['nullable', 'string'],
        ];
    }
}
