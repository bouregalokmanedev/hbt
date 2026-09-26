<?php

namespace App\Domains\StudentAssessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StartAssessmentRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }
    public function rules(): array { return []; }
}
