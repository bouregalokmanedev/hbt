# Access Control (Sprint 1)

Architectural principle: **Super Admin controls the platform; Admin operates
the platform; Support assists users; Instructor manages teaching; Student
consumes learning.**

Enforcement chain for every sensitive operation:

```
Authentication → Role → Permission → Policy → Domain Action → Audit
```

## Permission catalog

`app/Domains/Admin/AccessControl/AdminPermissions.php` is the single source
of truth. Never introduce a new admin capability as a bare
`$user->hasRole(...)` check — register a permission, assign it in
`AccessControlSeeder`, enforce via middleware / policies.

## Roles

| Role        | Scope                                                      |
|-------------|------------------------------------------------------------|
| Super Admin | All 42 permissions. Platform control (system, roles, money movement, revocation). |
| Admin       | 27 operating permissions. No system/roles/commerce/certificate-revocation/user-deletion/role-assignment. |
| Support     | 8 read + assist permissions (users/students view, learning view, verify, reply). |
| Instructor  | Teaching only (ownership-scoped, enforced in domain policies). |
| Student     | Learning only.                                             |

## Hard guarantees (tested live)

- Assigning Admin / Super Admin / Support requires Super Admin (`403` otherwise).
- Nobody can change their own role.
- The Super Admin role's permission set is immutable (`422`).
- The last Super Admin cannot be demoted or deleted (`422`).
- Role assignment and permission syncs write immutable audit rows
  (`role.assigned`, `permissions.synced` with actor, old/new values, IP).

## Endpoints (all under `/api/v1/admin`, auth + verified)

| Method | Path                          | Access      |
|--------|-------------------------------|-------------|
| GET    | `/roles`                      | Super Admin |
| PATCH  | `/roles/{roleName}/permissions`| Super Admin |
| *      | existing users/courses/…      | Admin+      |

## Seeding

`AccessControlSeeder` (called from `DatabaseSeeder`) is idempotent:
creates all 5 roles + 42 permissions and syncs Super Admin / Admin /
Support defaults. Re-run any time with
`php artisan db:seed --class=AccessControlSeeder`.
