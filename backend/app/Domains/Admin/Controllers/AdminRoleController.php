<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\AccessControl\AdminPermissions;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Exceptions\RoleDoesNotExist;
use Spatie\Permission\Models\Role;

class AdminRoleController extends Controller
{
    public function index(): JsonResponse
    {
        $pivot = config('permission.table_names.model_has_roles', 'model_has_roles');

        $roles = Role::with('permissions')->get()->map(function (Role $role) use ($pivot) {
            $usersCount = (int) DB::table($pivot)
                ->where('role_id', $role->getKey())
                ->where('model_type', User::class)
                ->count();

            return [
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'users_count' => $usersCount,
                'permissions' => $role->permissions->pluck('name')->sort()->values(),
                'protected' => $role->name === UserRole::SUPER_ADMIN->value,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Roles retrieved.',
            'data' => [
                'roles' => $roles,
                'catalog' => AdminPermissions::grouped(),
            ],
        ]);
    }

    public function updatePermissions(Request $request, string $roleName, AuditService $audit): JsonResponse
    {
        try {
            $role = Role::findByName($roleName, 'web');
        } catch (RoleDoesNotExist) {
            abort(404, 'Role not found.');
        }
        abort_if($role->name === UserRole::SUPER_ADMIN->value, 422, 'The Super Admin role cannot be modified.');

        $data = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $old = $role->permissions()->pluck('name')->sort()->values()->all();

        $role->syncPermissions($data['permissions']);

        $audit->log(
            'permissions.synced',
            $role,
            ['permissions' => $old],
            ['permissions' => collect($data['permissions'])->sort()->values()->all()],
        );

        return response()->json([
            'success' => true,
            'message' => "Permissions updated for {$role->name}.",
            'data' => [
                'name' => $role->name,
                'permissions' => $role->refresh()->permissions->pluck('name')->sort()->values(),
            ],
        ]);
    }
}
