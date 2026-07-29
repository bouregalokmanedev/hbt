<?php

namespace App\Actions\Users;


use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\Users\UpdateUserData;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Events\ModelChanged;

final readonly class UpdateUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(User $user, UpdateUserData $dto): User
{
    return DB::transaction(function () use ($user, $dto) {

        $old = $user->only([
            'first_name',
            'last_name',
            'username',
            'email',
            'phone',
            'country',
            'language',
            'timezone',
            'status',
        ]);

        $updatedUser = $this->users->update($user, [

    'first_name' => $dto->firstName,
    'last_name' => $dto->lastName,
    'username' => $dto->username,
    'email' => $dto->email,
    'phone' => $dto->phone,
    'country' => $dto->country,
    'language' => $dto->language,
    'timezone' => $dto->timezone,

]);

        event(new ModelChanged(

            event: 'user.updated',

            model: $updatedUser,

            old: $old,

            new: $updatedUser->fresh()->only([
                'first_name',
                'last_name',
                'username',
                'email',
                'phone',
                'country',
                'language',
                'timezone',
                'status',
            ]),

        ));

        return $updatedUser;
    });
}
}