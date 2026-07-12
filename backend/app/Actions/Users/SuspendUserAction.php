<?php

namespace App\Actions\Users;

use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;
use App\Enums\UserStatus;
use Illuminate\Support\Facades\Log;



final readonly class SuspendUserAction
{
    public function execute(User $user): ActionResult
    {
        return DB::transaction(function () use ($user) {

            if ($user->status === UserStatus::SUSPENDED->value) {
                return ActionResult::failure(
                    'User already suspended.'
                );
            }

            if (auth()->id() === $user->id) {
    return ActionResult::failure(
        'You cannot suspend your own account.'
    );
}

            $user->update([
    'status' => UserStatus::SUSPENDED->value,
]);

            return ActionResult::success(
                $user->fresh(),
                'User suspended successfully.'
            );

        });
    }
}