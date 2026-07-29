<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserSessionResource;
use App\Models\UserSession;
use App\Services\Session\SessionService;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class SessionController extends Controller
{
    use ApiResponse;

    public function __construct(
        private SessionService $sessions
    ) {}

    public function index(): JsonResponse
    {
        return $this->success(

            UserSessionResource::collection(

                $this->sessions->all(
                    auth()->user()
                )

            )

        );
    }

    public function current(): JsonResponse
    {
        return $this->success(

            new UserSessionResource(

                $this->sessions->current(
                    auth()->user()
                )

            )

        );
    }

    public function destroy(
        UserSession $session
    ): JsonResponse {

        abort_unless(
            $session->user_id === auth()->id(),
            403
        );

        $this->sessions->logout($session);

        return $this->success(
            null,
            'Session revoked.'
        );
    }

    public function destroyOthers(): JsonResponse
    {
        $this->sessions->logoutOthers(
            auth()->user()
        );

        return $this->success(
            null,
            'Other sessions revoked.'
        );
    }
}