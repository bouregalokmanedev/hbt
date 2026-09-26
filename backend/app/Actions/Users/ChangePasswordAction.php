<?php

namespace App\Actions\Users;

use App\Domains\Security\Services\SecurityNotificationService;
use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final readonly class ChangePasswordAction
{
    public function __construct(
        private SecurityNotificationService $securityNotifications,
    ) {}

    public function execute(
        User $user,
        string $password
    ): ActionResult {

        $result = DB::transaction(function () use ($user, $password) {

            $user->update([
                'password' => Hash::make($password)
            ]);

            // Revoke every API token so stolen tokens die with the old password.
            $user->tokens()->delete();

            // Close all tracked sessions; the user must sign in again.
            $user->sessions()->update([
                'logged_out_at' => now(),
                'is_current' => false,
            ]);

            return ActionResult::success(
                null,
                'Password updated successfully.'
            );

        });

        // Outside the transaction: in-app row + optional email per prefs.
        $this->securityNotifications->notifyPasswordChanged($user);

        return $result;
    }
}
