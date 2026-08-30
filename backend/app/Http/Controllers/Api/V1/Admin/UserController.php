<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domains\Admin\Queries\AdminUserQuery;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\CreateUserRequest;
use App\Http\Requests\Api\V1\Admin\UpdateUserRequest;
use App\Http\Requests\Api\V1\Admin\ChangePasswordRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return UserResource::collection(
            app(AdminUserQuery::class)->paginate(
                $request->only([
                    'search', 'status', 'role', 'email_verified', 'created_from',
                    'created_to', 'deleted', 'sort', 'direction',
                ]),
                $request->integer('per_page', 15),
            )
        )->response();
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);
        $attributes = $request->validated();
        $attributes['status'] ??= 'active';

        $user = User::query()->create($attributes);
        $user->assignRole(UserRole::STUDENT->value);

        return (new UserResource($user->fresh()->load('roles')))
            ->response()
            ->setStatusCode(201);
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
        $user->update($request->validated());

        return new UserResource($user->fresh()->load('roles'));
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function changePassword(ChangePasswordRequest $request, User $user): JsonResponse
    {
        $this->authorize('changePassword', $user);

        $user->tokens()->delete();
        $user->sessions()->update(['logged_out_at' => now(), 'is_current' => false]);
        $user->update(['password' => Hash::make($request->validated('password'))]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function assignRole(Request $request, User $user): UserResource
    {
        $this->authorize('assignRole', $user);
        $data = $request->validate(['role' => ['required', Rule::enum(UserRole::class)]]);

        $privilegedRole = in_array($data['role'], [
            UserRole::ADMIN->value,
            UserRole::SUPER_ADMIN->value,
        ], true);
        abort_if($privilegedRole && ! $request->user()->hasRole(UserRole::SUPER_ADMIN->value), 403);

        $user->syncRoles([$data['role']]);

        return new UserResource($user->fresh()->load('roles'));
    }

    public function suspend(User $user): UserResource
    {
        $this->authorize('suspend', $user);

        $user->tokens()->delete();
        $user->sessions()->update(['logged_out_at' => now(), 'is_current' => false]);
        $user->update(['status' => 'suspended']);

        return new UserResource($user->fresh()->load('roles'));
    }

    public function activate(User $user): UserResource
    {
        $this->authorize('suspend', $user);

        $user->update(['status' => 'active']);

        return new UserResource($user->fresh()->load('roles'));
    }

    public function restore(User $user): UserResource
    {
        $this->authorize('restore', User::class);
        abort_unless($user->trashed(), 422, 'This user has not been deleted.');

        $user->restore();

        return new UserResource($user->fresh()->load('roles'));
    }
}
