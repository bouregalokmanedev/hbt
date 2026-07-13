<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseApiRequest extends FormRequest
{
    /**
     * Force JSON responses.
     */
    public function expectsJson(): bool
    {
        return true;
    }

    /**
     * Standard validation error response.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(

            response()->json([

                'success' => false,

                'message' => 'Validation failed.',

                'errors' => $validator->errors(),

            ], 422)

        );
    }

    /**
     * Standard authorization error response.
     */
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(

            response()->json([

                'success' => false,

                'message' => 'Unauthorized.',

            ], 403)

        );
    }
}