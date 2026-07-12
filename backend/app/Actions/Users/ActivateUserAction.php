<?php

namespace App\Actions\Users;

use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
                'status' => 'active'
            ]);

            return ActionResult::success(
                $user->fresh(),
                'User activated successfully.'
            );

        });
    }
}