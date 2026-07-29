<?php

namespace App\Services\Security;

use App\Models\AuthenticationLog;
use App\Models\User;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;

class AuthenticationLogService
{
    public function log(
        string $event,
        bool $successful,
        ?User $user,
        string $email,
        Request $request,
        ?string $reason = null,
        array $metadata = []
    ): void {

        $agent = new Agent();

        $agent->setUserAgent(
            $request->userAgent()
        );

        AuthenticationLog::create([

            'user_id'=>$user?->id,

            'event'=>$event,

            'successful'=>$successful,

            'email'=>$email,

            'ip_address'=>$request->ip(),

            'user_agent'=>$request->userAgent(),

            'browser'=>$agent->browser(),

            'platform'=>$agent->platform(),

            'device_type'=>$this->device($agent),

            'failure_reason'=>$reason,

            'metadata'=>$metadata,

        ]);

    }

    private function device(Agent $agent): string
    {
        return match(true){

            $agent->isDesktop()=>'desktop',

            $agent->isPhone()=>'phone',

            $agent->isTablet()=>'tablet',

            default=>'unknown'

        };
    }
}