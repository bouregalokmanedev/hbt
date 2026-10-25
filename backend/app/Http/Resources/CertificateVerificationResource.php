<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public verification payload. Deliberately excludes internal identifiers
 * (user, enrollment, assessment result) so a certificate number never leaks
 * platform internals.
 */
final class CertificateVerificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'certificate_number' => $this->certificate_number,
            'recipient_name' => $this->recipient_name,
            'course_title' => $this->course_title,
            'issued_at' => $this->issued_at,
            'status' => $this->revoked_at === null ? 'valid' : 'revoked',
            'revoked_at' => $this->revoked_at,
        ];
    }
}
