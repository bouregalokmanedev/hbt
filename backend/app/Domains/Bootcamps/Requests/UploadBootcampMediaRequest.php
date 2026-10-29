<?php

namespace App\Domains\Bootcamps\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UploadBootcampMediaRequest extends FormRequest
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
        return match ($this->route('type')) {
            'thumbnail', 'cover_image' => [
                'file' => [
                    'required',
                    'file',
                    'image',
                    'mimes:jpg,jpeg,png,webp',
                    'max:5120',
                ],
            ],
            'preview_video' => [
                'file' => [
                    'required',
                    'file',
                    'mimetypes:video/mp4,video/webm',
                    'mimes:mp4,webm',
                    'max:51200',
                ],
            ],
            default => [
                'file' => ['required', 'file'],
            ],
        };
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.image' => 'Upload a JPG, PNG or WebP image.',
            'file.mimes' => 'This file type is not supported for bootcamp media.',
            'file.max' => 'The selected file is too large.',
            'file.mimetypes' => 'Upload an MP4 or WebM video.',
        ];
    }
}
