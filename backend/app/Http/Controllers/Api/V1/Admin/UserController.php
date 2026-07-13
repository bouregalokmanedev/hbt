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
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class UserController extends Controller
{
    use ApiResponse;
    use AuthorizesRequests;

    public function __construct(
    private readonly UserManagementService $users,
    private readonly RoleService $roles,
    private readonly PasswordService $passwords,
    private readonly UserRepositoryInterface $repository,
) {
    $this->middleware('auth:sanctum');
}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);
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
        $this->authorize('create', User::class);
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
        $this->authorize('view', $user);
        return $this->success(
            new UserResource($user)
        );
    }

    public function update(
        UpdateUserRequest $request,
        User $user
    ): JsonResponse {
        $this->authorize('update', $user);
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
        $this->authorize('delete', $user);
        $result = $this->userService->delete($user);

        return $this->success(
            null,
            $result->message
        );
    }
    public function changePassword(Request $request, User $user)
{
    $this->authorize('changePassword', $user);

    $user->update([
        'password' => bcrypt($request->password),
    ]);

    return response()->json([
        'message' => 'Password changed successfully.',
    ]);
}
public function assignRole(Request $request, User $user)
{
    $this->authorize('assignRole', $user);

    $user->syncRoles([$request->role]);

    return new UserResource($user);
}
public function suspend(User $user)
{
    $this->authorize('suspend', $user);

    $user->update([
        'status' => 'suspended',
    ]);

    return new UserResource($user);
}
public function restore(User $user)
{
    $this->authorize('restore', User::class);

    $user->restore();

    return new UserResource($user);
}
}