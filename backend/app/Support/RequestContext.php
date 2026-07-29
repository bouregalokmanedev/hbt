<?php

namespace App\Support;

use Illuminate\Http\Request;

final readonly class RequestContext
{
    public function __construct(
        public string $ip,
        public string $userAgent,
        public string $requestId,
    ) {}

    public static function fromRequest(
        Request $request
    ): self {

        return new self(

            ip: $request->ip(),

            userAgent: $request->userAgent(),

            requestId: (string) str()->uuid(),

        );

    }
}