import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Save, ShieldCheck, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api/errors";

import { adminApi } from "../api/adminApi";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
} from "../components/AdminUi";

export function AdminRolesPage() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [savedRole, setSavedRole] = useState<string | null>(null);
  const [failedRole, setFailedRole] = useState<{ role: string; message: string } | null>(null);

  const rolesQuery = useQuery({ queryKey: ["admin", "roles"], queryFn: adminApi.roles });

  const save = useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
      adminApi.updateRolePermissions(role, permissions),
    onSuccess: (updated) => {
      setDraft((current) => ({ ...current, [updated.name]: updated.permissions }));
      setSavedRole(updated.name);
      setFailedRole(null);
      window.setTimeout(() => setSavedRole(null), 2500);
      void client.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (reason: unknown, variables) => {
      const message =
        reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : t("admin.roles.saveFallback");
      setFailedRole({ role: variables.role, message });
    },
  });

  if (rolesQuery.isLoading) return <LoadingAdminPage />;
  if (rolesQuery.isError || !rolesQuery.data)
    return <ErrorAdminPage onRetry={() => void rolesQuery.refetch()} />;

  const { roles, catalog } = rolesQuery.data;
  const groups = Object.entries(catalog);

  const toggle = (role: string, permission: string, current: string[]) => {
    setFailedRole(null);
    setDraft((prev) => {
      const list = prev[role] ?? current;
      const next = list.includes(permission) ? list.filter((entry) => entry !== permission) : [...list, permission];
      return { ...prev, [role]: next };
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading
        eyebrow={t("admin.roles.eyebrow")}
        title={t("admin.roles.title")}
        description={t("admin.roles.description")}
      />

      {savedRole && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {t("admin.roles.saved", { role: savedRole })}
        </div>
      )}
      {failedRole && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("admin.roles.saveError", { role: failedRole.role, message: failedRole.message })}
        </div>
      )}

      <div className="grid gap-5">
        {roles.map((role) => {
          const current = draft[role.name] ?? role.permissions;
          const dirty = (draft[role.name] ?? null) !== null && JSON.stringify([...current].sort()) !== JSON.stringify([...role.permissions].sort());
          return (
            <AdminPanel key={role.name}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    {role.protected ? <Lock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </span>
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-[#3A3A3A]">
                      {role.name}
                      {role.protected && (
                        <span className="rounded-full bg-[#3A3A3A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-white">
                          {t("admin.roles.protectedBadge")}
                        </span>
                      )}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#3A3A3A]/50">
                      <UsersRound className="h-3 w-3 rtl:-scale-x-100" /> {t("admin.roles.meta", { accounts: role.users_count, permissions: current.length })}
                    </p>
                  </div>
                </div>
                {!role.protected && (
                  <button
                    type="button"
                    disabled={save.isPending || !dirty}
                    onClick={() => save.mutate({ role: role.name, permissions: current })}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_6px_16px_rgba(244,120,34,.22)] transition hover:bg-[#e96916] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 rtl:-scale-x-100" />
                    {save.isPending ? t("admin.roles.saving") : t("admin.roles.save")}
                  </button>
                )}
              </div>

              {role.protected ? (
                <p className="mt-4 rounded-xl bg-[#F7F7F7] px-4 py-3 text-xs leading-5 text-[#3A3A3A]/55">
                  {t("admin.roles.protectedNote")}
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {groups.map(([group, permissions]) => (
                    <div key={group}>
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#3A3A3A]/40">{group}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {permissions.map((permission) => {
                          const active = current.includes(permission);
                          return (
                            <button
                              key={permission}
                              type="button"
                              onClick={() => toggle(role.name, permission, role.permissions)}
                              aria-pressed={active}
                              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] font-semibold transition ${
                                active
                                  ? "border-[#F47822] bg-[#F47822]/10 text-[#F47822]"
                                  : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/45 hover:border-[#F47822]/40 hover:text-[#3A3A3A]"
                              }`}
                            >
                              {permission}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>
          );
        })}
      </div>
    </div>
  );
}
