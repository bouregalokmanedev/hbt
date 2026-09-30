import { RefreshCw, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    AdminButton,
    AdminHeading,
    AdminPanel,
    ErrorAdminPage,
    LoadingAdminPage,
    PageControls,
} from "../components/AdminUi";
import { UsersTable } from "../components/UsersTable";
import { UsersToolbar } from "../components/UsersToolbar";
import { useAdminUsers } from "../hooks/useAdminUsers";

export function AdminUsersPage() {
    const { t } = useTranslation();
    const {
        users,
        filters,
        hasFilters,
        setFilters,
        clearFilters,
        run,
        isPending,
        isFetching,
        actionError,
        refetch,
    } = useAdminUsers();

    if (users.isLoading) return <LoadingAdminPage />;
    if (users.isError || !users.data) return <ErrorAdminPage onRetry={refetch} />;

    const data = users.data;
    const verifiedOnPage = data.data.filter((user) => user.email_verified_at).length;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <AdminHeading
                eyebrow={t("admin.users.eyebrow")}
                title={t("admin.users.title")}
                description={t("admin.users.description")}
                action={
                    <AdminButton variant="secondary" size="md" onClick={refetch} className="rounded-full ps-3.5">
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                        {t("admin.users.refresh")}
                    </AdminButton>
                }
            />

            {actionError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {actionError}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
                <Mini
                    label={t("admin.users.metrics.total")}
                    value={data.meta.total}
                    icon={<UsersRound className="h-4 w-4" />}
                />
                <Mini
                    label={t("admin.users.metrics.verified")}
                    value={verifiedOnPage}
                    icon={<UserCheck className="h-4 w-4" />}
                />
                <Mini
                    label={t("admin.users.metrics.roleProtection")}
                    value={t("admin.users.metrics.enabled")}
                    icon={<ShieldCheck className="h-4 w-4" />}
                />
            </div>

            <AdminPanel>
                <UsersToolbar
                    search={filters.search}
                    role={filters.role}
                    status={filters.status}
                    onSearch={(value) => setFilters({ search: value })}
                    onRole={(value) => setFilters({ role: value })}
                    onStatus={(value) => setFilters({ status: value })}
                    onClear={clearFilters}
                    hasFilters={hasFilters}
                />

                <UsersTable
                    users={data.data}
                    total={data.meta.total}
                    isFetching={isFetching}
                    disabled={isPending}
                    onAction={run}
                />

                <div className="mt-5">
                    <PageControls
                        page={data.meta.current_page}
                        lastPage={data.meta.last_page}
                        onPage={(page) => setFilters({ page: String(page) })}
                    />
                </div>
            </AdminPanel>
        </div>
    );
}

function Mini({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_8px_22px_rgba(58,58,58,.035)]">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                {icon}
            </span>
            <p className="mt-4 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-[#3A3A3A]/47">{label}</p>
        </div>
    );
}
