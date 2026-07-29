<?php

namespace App\Services\Security;

use App\Support\RequestContext;
use Illuminate\Http\Request;

class SecurityService
{
    public function __construct(
        private DeviceDetectionService $devices,
    ) {}

    public function context(
        Request $request
    ): array {

        return [

            'request' => RequestContext::fromRequest($request),

            'device' => $this->devices->detect($request),

        ];

    }
}