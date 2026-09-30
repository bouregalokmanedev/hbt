import { useTranslation } from "react-i18next";

import type { UserAction } from "../hooks/useAdminUsers";
import type { AdminUser } from "../types/admin";
import { UserRow } from "./UserRow";

export function UsersTable({
    users,
    total,
    isFetching,
    disabled,
    onAction,
}: {
    users: AdminUser[];
    total: number;
    isFetching: boolean;
    disabled: boolean;
    onAction(action: UserAction): void;
}) {
    const { t } = useTranslation();

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[#3A3A3A]/45">
                    {t("admin.common.total", { count: total })}
                </p>
                {isFetching && (
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#F47822]">
                        {t("admin.common.loading")}
                    </p>
                )}
            </div>

            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left rtl:text-right">
                    <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
                        <tr>
                            <th className="pb-3">{t("admin.users.headers.person")}</th>
                            <th className="pb-3">{t("admin.users.headers.role")}</th>
                            <th className="pb-3">{t("admin.users.headers.verification")}</th>
                            <th className="pb-3">{t("admin.users.headers.status")}</th>
                            <th className="pb-3">{t("admin.users.headers.joined")}</th>
                            <th className="pb-3 text-right rtl:text-left">
                                {t("admin.users.headers.actions")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A3A3A]/7">
                        {users.map((user) => (
                            <UserRow
                                key={user.id}
                                user={user}
                                disabled={disabled}
                                onAction={onAction}
                            />
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-12 text-center text-sm text-[#3A3A3A]/45"
                                >
                                    {t("admin.users.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
