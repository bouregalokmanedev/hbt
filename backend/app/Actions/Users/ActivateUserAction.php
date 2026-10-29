<?php

namespace App\Actions\Users;

use App\Enums\UserStatus;
use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;

final readonly class ActivateUserAction
{
    public function execute(User $user): ActionResult
    {
        return DB::transaction(function () use ($user) {
            if ($user->status === UserStatus::ACTIVE->value) {
                return ActionResult::failure(
                    'User already active.'
                );
            }

            $user->update([
                'status' => UserStatus::ACTIVE->value,
            ]);

            return ActionResult::success(
                $user->fresh(),
                'User activated successfully.'
            );
        });
    }
}
