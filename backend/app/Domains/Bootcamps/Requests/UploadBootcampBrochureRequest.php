<?php

namespace App\Domains\Bootcamps\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UploadBootcampBrochureRequest extends FormRequest
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
            'brochure' => [
                'required',
                'file',
                'mimetypes:application/pdf,application/x-pdf',
                'mimes:pdf',
                'max:10240',
            ],
        ];
    }
}
