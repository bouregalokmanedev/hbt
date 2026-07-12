<?php

namespace App\Actions\Users;

use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final readonly class ChangePasswordAction
{
    public function execute(
        User $user,
        string $password
    ): ActionResult {

        return DB::transaction(function () use ($user, $password) {

            $user->update([
                'password' => Hash::make($password)
            ]);

            return ActionResult::success(
                null,
                'Password updated successfully.'
            );

        });

    }
}