<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Events\ModelChanged;
use App\Support\ActionResult;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

final readonly class RestoreUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(int $id): ActionResult
    {
        return DB::transaction(function () use ($id) {
            try {
                $this->users->restore($id);
            } catch (ModelNotFoundException) {
                return ActionResult::failure(
                    'User not found.'
                );
            }

            $user = $this->users->findById($id);

            if ($user !== null) {
                event(new ModelChanged(
                    event: 'user.restored',
                    model: $user,
                ));
            }

            return ActionResult::success(
                $user,
                'User restored successfully.'
            );
        });
    }
}
