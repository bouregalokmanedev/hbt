<?php

namespace App\Domains\Students\Controllers;

use App\Domains\Students\Requests\ChangeStudentPasswordRequest;
use App\Http\Controllers\Controller;
use App\Services\Users\PasswordService;
use Illuminate\Http\JsonResponse;

class StudentSecurityController extends Controller
{
    public function __construct(
        private readonly PasswordService $passwordService,
    ) {
    }

    public function changePassword(
        ChangeStudentPasswordRequest $request,
    ): JsonResponse {
        $result = $this->passwordService->change(
            $request->user(),
            $request->validated()['password'],
        );

        return response()->json([
            'message' => $result->message,
            'data' => null,
        ]);
    }
}