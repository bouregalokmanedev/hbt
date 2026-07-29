<?php

namespace App\Services\Security;

use App\DTOs\Security\DeviceInfo;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;

class DeviceDetectionService
{
    public function detect(Request $request): DeviceInfo
    {
        $agent = new Agent();

        $agent->setUserAgent(
            $request->userAgent()
        );

        return new DeviceInfo(

            browser: $agent->browser(),

            browserVersion: $agent->version(
                $agent->browser()
            ),

            platform: $agent->platform(),

            platformVersion: $agent->version(
                $agent->platform()
            ),

            device: $agent->device(),

            deviceType: $this->deviceType($agent),

            isBot: $agent->isRobot(),

        );
    }

    private function deviceType(
        Agent $agent
    ): string {

        return match (true) {

            $agent->isDesktop() => 'desktop',

            $agent->isTablet() => 'tablet',

            $agent->isPhone() => 'phone',

            default => 'unknown',

        };
    }
}