<?php

namespace Database\Seeders;

use App\Domains\Admin\AccessControl\AdminPermissions;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AccessControlSeeder extends Seeder
{
    public function run(): void
    {
        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'web');
        }

        foreach (AdminPermissions::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach ([UserRole::SUPER_ADMIN, UserRole::ADMIN, UserRole::SUPPORT] as $role) {
            Role::findByName($role->value, 'web')
                ->syncPermissions(AdminPermissions::defaultsFor($role->value));
        }

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
