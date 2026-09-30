import { useReducer } from "react";
import { useTranslation } from "react-i18next";

import { AVATAR_SQUARE_SHAPE } from "@/components/ui";

import type { UserAction } from "../hooks/useAdminUsers";
import type { AdminUser } from "../types/admin";
import { AdminButton, AdminSelect, Status } from "./AdminUi";
import { ROLE_OPTIONS, STATUS_OPTIONS, roleLabelKey, statusLabelKey } from "./userOptions";

function formatDate(value: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

export function UserRow({
    user,
    disabled,
    onAction,
}: {
    user: AdminUser;
    disabled: boolean;
    onAction(action: UserAction): void;
}) {
    const { t, i18n } = useTranslation();
    const verified = Boolean(user.email_verified_at);
    // Cancelling a confirm must put the <select> back on the bound value;
    // bumping the key remounts it with the controlled option selected.
    const [syncTick, syncControls] = useReducer((tick: number) => tick + 1, 0);

    return (
        <tr className="transition hover:bg-[#FCFCFC]">
            {/* Person */}
            <td className="py-4">
                <div className="flex items-center gap-3">
                    <span
                        className={`grid h-9 w-9 shrink-0 place-items-center ${AVATAR_SQUARE_SHAPE} bg-[#F47822]/10 text-xs font-bold text-[#F47822]`}
                    >
                        {user.first_name[0]}
                        {user.last_name[0]}
                    </span>
                    <span>
                        <span className="block text-sm font-semibold">
                            {user.first_name} {user.last_name}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#3A3A3A]/45">
                            {user.email}
                        </span>
                    </span>
                </div>
            </td>

            {/* Role */}
            <td className="py-4">
                <AdminSelect
                    size="sm"
                    value={user.roles[0] ?? "Student"}
                    disabled={disabled}
                    ariaLabel={t("admin.users.headers.role")}
                    onChange={(role) => onAction({ action: "role", id: user.id, role })}
                    options={ROLE_OPTIONS.map((option) => ({
                        value: option,
                        label: t(roleLabelKey(option)),
                    }))}
                />
            </td>

            {/* Verification */}
            <td className="py-4 text-xs text-[#3A3A3A]/55">
                {verified ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {t("admin.users.row.verified")}
                        </span>
                        <AdminButton
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            onClick={() => {
                                if (window.confirm(t("admin.users.confirmUnverify"))) {
                                    onAction({ action: "unverify", id: user.id });
                                }
                            }}
                        >
                            {t("admin.users.row.undoVerify")}
                        </AdminButton>
                    </span>
                ) : (
                    <span className="inline-flex flex-wrap items-center gap-2">
                        <span>{t("admin.users.row.notVerified")}</span>
                        <AdminButton
                            variant="primary"
                            size="sm"
                            disabled={disabled}
                            onClick={() => onAction({ action: "verify", id: user.id })}
                        >
                            {t("admin.users.row.verify")}
                        </AdminButton>
                    </span>
                )}
            </td>

            {/* Status */}
            <td className="py-4">
                <div className="flex items-center gap-2">
                    <Status value={user.status} />
                    <AdminSelect
                        key={`status-${user.id}-${user.status}-${syncTick}`}
                        size="sm"
                        value={user.status}
                        disabled={disabled}
                        ariaLabel={t("admin.users.changeStatus")}
                        onChange={(next) => {
                            if (next === user.status) return;
                            const label = t(statusLabelKey(next));
                            if (!window.confirm(t("admin.users.confirmStatus", { status: label }))) {
                                syncControls();
                                return;
                            }
                            onAction({ action: "status", id: user.id, status: next });
                        }}
                        options={STATUS_OPTIONS.map((option) => ({
                            value: option,
                            label: t(statusLabelKey(option)),
                        }))}
                    />
                </div>
            </td>

            {/* Joined */}
            <td className="py-4 text-xs text-[#3A3A3A]/50">
                {formatDate(user.created_at, i18n.language)}
            </td>

            {/* Actions */}
            <td className="py-4 text-right rtl:text-left">
                <div className="flex justify-end gap-2 rtl:justify-start">
                    <AdminButton
                        variant={user.status === "suspended" ? "success" : "danger"}
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                            if (user.status !== "suspended" && !window.confirm(t("admin.users.confirmSuspend"))) {
                                return;
                            }
                            onAction({
                                action: user.status === "suspended" ? "activate" : "suspend",
                                id: user.id,
                            });
                        }}
                    >
                        {user.status === "suspended"
                            ? t("admin.users.row.activate")
                            : t("admin.users.row.suspend")}
                    </AdminButton>
                </div>
            </td>
        </tr>
    );
}
