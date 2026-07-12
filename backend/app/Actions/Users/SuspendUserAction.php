<?php

namespace App\Actions\Users;

use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;

final readonly class SuspendUserAction
{
    public function execute(User $user): ActionResult
    {
        return DB::transaction(function () use ($user) {

            if ($user->status === 'suspended') {
                return ActionResult::failure(
                    'User already suspended.'
                );
            }

            $user->update([
                'status' => 'suspended'
            ]);

            return ActionResult::success(
                $user->fresh(),
                'User suspended successfully.'
            );

        });
    }
}