import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AdminButton, AdminSelect } from "./AdminUi";
import { ROLE_OPTIONS, STATUS_OPTIONS, roleLabelKey, statusLabelKey } from "./userOptions";

export function UsersToolbar({
    search,
    role,
    status,
    onSearch,
    onRole,
    onStatus,
    onClear,
    hasFilters,
}: {
    search: string;
    role: string;
    status: string;
    onSearch(value: string): void;
    onRole(value: string): void;
    onStatus(value: string): void;
    onClear(): void;
    hasFilters: boolean;
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/40" />
                <input
                    type="search"
                    value={search}
                    onChange={(event) => onSearch(event.target.value)}
                    placeholder={t("admin.users.searchPh")}
                    className="h-11 w-full rounded-xl border border-[#3A3A3A]/12 bg-[#FCFCFC] ps-10 pe-3 text-sm outline-none transition hover:border-[#3A3A3A]/25 focus:border-[#F47822] focus:bg-white focus:ring-2 focus:ring-[#F47822]/15"
                />
            </label>

            <AdminSelect
                value={role}
                onChange={onRole}
                ariaLabel={t("admin.users.filters.allRoles")}
                options={[
                    { value: "", label: t("admin.users.filters.allRoles") },
                    ...ROLE_OPTIONS.map((option) => ({
                        value: option,
                        label: t(roleLabelKey(option)),
                    })),
                ]}
            />

            <AdminSelect
                value={status}
                onChange={onStatus}
                ariaLabel={t("admin.users.filters.allStatuses")}
                options={[
                    { value: "", label: t("admin.users.filters.allStatuses") },
                    ...STATUS_OPTIONS.map((option) => ({
                        value: option,
                        label: t(statusLabelKey(option)),
                    })),
                ]}
            />

            {hasFilters && (
                <AdminButton variant="ghost" size="md" onClick={onClear}>
                    <X className="size-3.5" />
                    {t("admin.users.clearFilters")}
                </AdminButton>
            )}
        </div>
    );
}
