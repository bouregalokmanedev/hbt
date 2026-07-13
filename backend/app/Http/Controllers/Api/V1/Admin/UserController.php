<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\CreateUserRequest;
use App\Http\Requests\Api\V1\Admin\UpdateUserRequest;
use App\Http\Requests\Api\V1\Admin\ChangePasswordRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use App\Services\Users\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly UserService $userService,
        private readonly UserRepositoryInterface $users,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->users->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only([
                'search',
                'status',
                'role',
                'sort',
                'direction',
            ]),
        );

        return $this->success(
            UserResource::collection($users)
        );
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        $result = $this->userService->create(
            $request->dto()
        );

        if (! $result->success) {
            return $this->error(
                $result->message,
                422,
                $result->errors ?? []
            );
        }

        return $this->success(
            new UserResource($result->data),
            $result->message,
            201
        );
    }

    public function show(User $user): JsonResponse
    {
        return $this->success(
            new UserResource($user)
        );
    }

    public function update(
        UpdateUserRequest $request,
        User $user
    ): JsonResponse {

        $result = $this->userService->update(
            $user,
            $request->dto()
        );

        return $this->success(
            new UserResource($result->data),
            $result->message
        );
    }

    public function destroy(User $user): JsonResponse
    {
        $result = $this->userService->delete($user);

        return $this->success(
            null,
            $result->message
        );
    }
}