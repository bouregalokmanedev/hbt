<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class CertificateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'certificate_number' => $this->certificate_number,
            'user_id' => $this->user_id,
            'enrollment_id' => $this->enrollment_id,
            'assessment_result_id' => $this->assessment_result_id,
            'course_id' => $this->course_id,
            'recipient_name' => $this->recipient_name,
            'course_title' => $this->course_title,
            'issued_at' => $this->issued_at,
            'verification_url' => url('/api/v1/certificates/verify/'.$this->certificate_number),
        ];
    }
}
