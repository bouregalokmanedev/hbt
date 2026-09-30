export const ROLE_OPTIONS = ["Student", "Instructor", "Admin", "Super Admin", "Support"] as const;

export const STATUS_OPTIONS = ["active", "inactive", "pending", "suspended"] as const;

const ROLE_LABEL_KEYS: Record<string, string> = {
    Student: "admin.users.row.roles.student",
    Instructor: "admin.users.row.roles.instructor",
    Admin: "admin.users.row.roles.admin",
    "Super Admin": "admin.users.row.roles.superAdmin",
    Support: "admin.users.row.roles.support",
};

/** Roles and statuses are a shared vocabulary: label keys live here so the
 * toolbar, the table, and any confirm dialog never drift apart. */
export function roleLabelKey(role: string): string {
    return ROLE_LABEL_KEYS[role] ?? ROLE_LABEL_KEYS.Student;
}

export function statusLabelKey(status: string): string {
    return `admin.users.filters.${status}`;
}
