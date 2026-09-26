import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  CircleAlert,
  FileText,
  HandCoins,
  ReceiptText,
  RefreshCcw,
  Repeat,
  ShieldAlert,
  Tags,
  Wallet,
  Webhook,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api/errors";

import { adminApi } from "../api/adminApi";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  PageControls,
} from "../components/AdminUi";

type Tab = "overview" | "orders" | "invoices" | "webhooks" | "failed" | "transactions" | "subscriptions" | "plans" | "refunds" | "payouts";

function errorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof ApiError && reason.errors) {
    const first = Object.values(reason.errors).flat().find((item): item is string => typeof item === "string");
    if (first) return first;
  }
  return reason instanceof Error ? reason.message : fallback;
}

function money(amount: number, currency: string, locale?: string): string {
  return `${amount.toLocaleString(locale)} ${currency}`;
}

export function AdminCommercePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const client = useQueryClient();

  const notify = async (work: () => Promise<unknown>, success: string) => {
    setNotice(null);
    setActionError(null);
    try {
      await work();
      await client.invalidateQueries({ queryKey: ["admin", "commerce"] });
      await client.invalidateQueries({ queryKey: ["admin", "plans"] });
      setNotice(success);
    } catch (reason) {
      setActionError(errorMessage(reason, t("admin.commerce.actionErrorFallback")));
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: t("admin.commerce.tabs.overview"), icon: <Wallet className="h-3.5 w-3.5" /> },
    { id: "orders", label: t("admin.commerce.tabs.orders"), icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "invoices", label: t("admin.commerce.tabs.invoices"), icon: <ReceiptText className="h-3.5 w-3.5" /> },
    { id: "webhooks", label: t("admin.commerce.tabs.webhooks"), icon: <Webhook className="h-3.5 w-3.5" /> },
    { id: "failed", label: t("admin.commerce.tabs.failed"), icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { id: "transactions", label: t("admin.commerce.tabs.transactions"), icon: <ReceiptText className="h-3.5 w-3.5" /> },
    { id: "subscriptions", label: t("admin.commerce.tabs.subscriptions"), icon: <Repeat className="h-3.5 w-3.5" /> },
    { id: "plans", label: t("admin.commerce.tabs.plans"), icon: <Tags className="h-3.5 w-3.5" /> },
    { id: "refunds", label: t("admin.commerce.tabs.refunds"), icon: <RefreshCcw className="h-3.5 w-3.5" /> },
    { id: "payouts", label: t("admin.commerce.tabs.payouts"), icon: <HandCoins className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading
        eyebrow={t("admin.commerce.eyebrow")}
        title={t("admin.commerce.title")}
        description={t("admin.commerce.description")}
      />

      {notice && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {notice}
        </div>
      )}
      {actionError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_4px_14px_rgba(58,58,58,.05)]">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              tab === entry.id ? "bg-[#3A3A3A] text-white shadow" : "text-[#3A3A3A]/55 hover:text-[#3A3A3A]"
            }`}
          >
            {entry.icon}
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "invoices" && <InvoicesTab />}
      {tab === "webhooks" && <WebhooksTab onDone={(work, success) => void notify(work, success)} />}
      {tab === "failed" && <FailedPaymentsTab />}
      {tab === "transactions" && <TransactionsTab onDone={(work, success) => void notify(work, success)} />}
      {tab === "subscriptions" && <SubscriptionsTab onDone={(work, success) => void notify(work, success)} />}
      {tab === "plans" && <PlansTab onDone={(work, success) => void notify(work, success)} />}
      {tab === "refunds" && <RefundsTab />}
      {tab === "payouts" && <PayoutsTab onDone={(work, success) => void notify(work, success)} />}
    </div>
  );
}

function OverviewTab() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const overview = useQuery({ queryKey: ["admin", "commerce", "overview"], queryFn: adminApi.commerceOverview });
  if (overview.isLoading) return <LoadingAdminPage />;
  if (overview.isError || !overview.data) return <ErrorAdminPage onRetry={() => void overview.refetch()} />;
  const data = overview.data;
  const max = Math.max(1, ...data.revenue_14d.map((point) => point.total));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t("admin.commerce.overview.gross")} value={money(data.gross_revenue, data.currency, locale)} icon={<ArrowUpRight className="h-4 w-4" />} tone="green" />
        <Kpi label={t("admin.commerce.overview.net")} value={money(data.net_revenue, data.currency, locale)} icon={<Banknote className="h-4 w-4" />} tone="brand" />
        <Kpi label={t("admin.commerce.overview.refunded")} value={money(data.refunded, data.currency, locale)} icon={<ArrowDownRight className="h-4 w-4" />} tone="red" />
        <Kpi label={t("admin.commerce.overview.activeSubs")} value={data.active_subscriptions} icon={<Repeat className="h-4 w-4" />} tone="dark" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label={t("admin.commerce.overview.purchases")} value={data.purchases} icon={<BadgeDollarSign className="h-4 w-4" />} tone="dark" />
        <Kpi label={t("admin.commerce.overview.pendingTx")} value={data.pending_transactions} icon={<CircleAlert className="h-4 w-4" />} tone="amber" />
        <Kpi label={t("admin.commerce.overview.failedTx")} value={data.failed_transactions} icon={<X className="h-4 w-4" />} tone="red" />
      </div>

      <AdminPanel>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.commerce.overview.revenueTag")}</p>
        <h2 className="mt-2 text-lg font-semibold">{t("admin.commerce.overview.last14Days")}</h2>
        <div className="mt-5 flex h-28 items-end gap-1.5">
          {data.revenue_14d.map((point) => (
            <div
              key={point.date}
              title={`${point.date}: ${point.total}`}
              className="flex-1 rounded-t-md bg-[#F47822]/85 transition-all hover:bg-[#F47822]"
              style={{ height: `${Math.max(6, Math.round((point.total / max) * 100))}%`, opacity: point.total === 0 ? 0.25 : 1 }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[#3A3A3A]/40">
          <span>{data.revenue_14d[0]?.date ?? ""}</span>
          <span>{data.revenue_14d[data.revenue_14d.length - 1]?.date ?? ""}</span>
        </div>
      </AdminPanel>

      <AdminPanel>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.commerce.overview.latestTag")}</p>
        <h2 className="mt-2 text-lg font-semibold">{t("admin.commerce.overview.recentTx")}</h2>
        {data.recent_transactions.length === 0 ? (
          <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("admin.commerce.overview.emptyTx")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.recent_transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center gap-3 rounded-xl bg-[#FCFCFC] px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-[#3A3A3A]">
                    {transaction.user ?? t("admin.commerce.overview.unknown")} · {transaction.course ?? transaction.kind}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-[#3A3A3A]/45">
                    {transaction.provider_ref ?? transaction.id.slice(0, 8)}
                  </span>
                </span>
                <span className="text-xs font-bold text-[#3A3A3A]">{money(transaction.amount, transaction.currency, locale)}</span>
                <StatusPill status={transaction.status} />
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

function TransactionsTab({ onDone }: { onDone: (work: () => Promise<unknown>, success: string) => void }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const list = useQuery({
    queryKey: ["admin", "commerce", "transactions", status, page],
    queryFn: () => adminApi.commerceTransactions({ status: status || undefined, page, per_page: 12 }),
  });

  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;
  const data = list.data;

  return (
    <AdminPanel>
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-semibold capitalize text-[#3A3A3A]/70 outline-none transition focus:border-[#F47822]"
        >
          <option value="">{t("admin.commerce.transactions.allStatuses")}</option>
          {["pending", "succeeded", "failed", "refunded", "disputed"].map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left rtl:text-right">
          <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
            <tr>
              <th className="pb-3">{t("admin.commerce.transactions.headers.customer")}</th>
              <th className="pb-3">{t("admin.commerce.transactions.headers.item")}</th>
              <th className="pb-3">{t("admin.commerce.transactions.headers.amount")}</th>
              <th className="pb-3">{t("admin.commerce.transactions.headers.status")}</th>
              <th className="pb-3 text-right rtl:text-left">{t("admin.commerce.transactions.headers.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]/7">
            {data.data.map((transaction) => (
              <tr key={transaction.id} className="transition hover:bg-[#FCFCFC]">
                <td className="py-4">
                  <p className="text-sm font-semibold">{transaction.user ?? "—"}</p>
                  <p className="font-mono text-[10px] text-[#3A3A3A]/45">{transaction.provider_ref ?? transaction.id.slice(0, 8)}</p>
                </td>
                <td className="max-w-[220px] truncate py-4 text-xs text-[#3A3A3A]/60">
                  {transaction.course ?? transaction.kind}
                </td>
                <td className="py-4 text-xs font-bold">{money(transaction.amount, transaction.currency, locale)}</td>
                <td className="py-4">
                  <StatusPill status={transaction.status} />
                </td>
                <td className="py-4">
                  <div className="flex justify-end gap-1.5">
                    {transaction.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onDone(() => adminApi.confirmTransaction(transaction.id), t("admin.commerce.notices.confirmTransaction"))}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          {t("admin.commerce.transactions.confirm")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDone(() => adminApi.failTransaction(transaction.id), t("admin.commerce.notices.failTransaction"))}
                          className="rounded-lg bg-[#3A3A3A]/5 px-3 py-2 text-xs font-bold text-[#3A3A3A]/60 transition hover:bg-red-50 hover:text-red-600"
                        >
                          {t("admin.commerce.transactions.fail")}
                        </button>
                      </>
                    )}
                    {transaction.status === "succeeded" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundingId(transaction.id);
                          setReason("");
                        }}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        {t("admin.commerce.transactions.refund")}
                      </button>
                    )}
                  </div>
                  {refundingId === transaction.id && (
                    <div className="mt-2 flex justify-end gap-1.5">
                      <input
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder={t("admin.commerce.transactions.reasonPh")}
                        className="h-9 w-44 rounded-lg border border-[#3A3A3A]/10 px-2.5 text-xs outline-none focus:border-[#F47822]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onDone(() => adminApi.refundTransaction(transaction.id, reason || undefined), t("admin.commerce.notices.refundTransaction"));
                          setRefundingId(null);
                        }}
                        className="h-9 rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"
                      >
                        {t("admin.commerce.transactions.ok")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data.data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-[#3A3A3A]/45">
                  {t("admin.commerce.transactions.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-5">
        <PageControls page={data.meta.current_page} lastPage={data.meta.last_page} onPage={setPage} />
      </div>
    </AdminPanel>
  );
}

function SubscriptionsTab({ onDone }: { onDone: (work: () => Promise<unknown>, success: string) => void }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [granting, setGranting] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlan, setGrantPlan] = useState("");

  const list = useQuery({
    queryKey: ["admin", "commerce", "subscriptions", status, page],
    queryFn: () => adminApi.commerceSubscriptions({ status: status || undefined, page, per_page: 12 }),
  });
  const plans = useQuery({ queryKey: ["admin", "plans"], queryFn: adminApi.plans });

  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;
  const data = list.data;

  return (
    <div className="space-y-6">
      <AdminPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.commerce.subscriptions.privileged")}</p>
            <h2 className="mt-1 text-base font-bold">{t("admin.commerce.subscriptions.grantTitle")}</h2>
            <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("admin.commerce.subscriptions.grantDesc")}</p>
          </div>
          <button
            type="button"
            onClick={() => setGranting((open) => !open)}
            className="rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822]"
          >
            {granting ? t("admin.commerce.subscriptions.cancel") : t("admin.commerce.subscriptions.grantAccess")}
          </button>
        </div>
        {granting && (
          <GrantSubscriptionForm
            plans={plans.data ?? []}
            email={grantEmail}
            setEmail={setGrantEmail}
            planId={grantPlan}
            setPlanId={setGrantPlan}
            onSubmit={(userId, planId) => {
              setGranting(false);
              onDone(() => adminApi.grantSubscription(userId, planId), t("admin.commerce.notices.grantSubscription"));
            }}
          />
        )}
      </AdminPanel>

      <AdminPanel>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-semibold capitalize text-[#3A3A3A]/70 outline-none transition focus:border-[#F47822]"
        >
          <option value="">{t("admin.commerce.subscriptions.allStatuses")}</option>
          {["pending", "trial", "active", "past_due", "cancelled", "expired"].map((entry) => (
            <option key={entry} value={entry}>
              {entry.replace("_", " ")}
            </option>
          ))}
        </select>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left rtl:text-right">
            <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
              <tr>
                <th className="pb-3">{t("admin.commerce.subscriptions.headers.subscriber")}</th>
                <th className="pb-3">{t("admin.commerce.subscriptions.headers.plan")}</th>
                <th className="pb-3">{t("admin.commerce.subscriptions.headers.status")}</th>
                <th className="pb-3">{t("admin.commerce.subscriptions.headers.renews")}</th>
                <th className="pb-3 text-right rtl:text-left">{t("admin.commerce.subscriptions.headers.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A3A3A]/7">
              {data.data.map((subscription) => (
                <tr key={subscription.id} className="transition hover:bg-[#FCFCFC]">
                  <td className="py-4">
                    <p className="text-sm font-semibold">{subscription.user ?? "—"}</p>
                    <p className="text-xs text-[#3A3A3A]/45">{subscription.email ?? ""}</p>
                  </td>
                  <td className="py-4 text-xs text-[#3A3A3A]/60">{subscription.plan ?? "—"}</td>
                  <td className="py-4">
                    <StatusPill status={subscription.status} />
                  </td>
                  <td className="py-4 text-xs text-[#3A3A3A]/50">
                    {subscription.current_period_ends_at ? new Date(subscription.current_period_ends_at).toLocaleDateString(locale) : "—"}
                  </td>
                  <td className="py-4 text-right rtl:text-left">
                    {!["cancelled", "expired"].includes(subscription.status) && (
                      <button
                        type="button"
                        onClick={() => onDone(() => adminApi.cancelSubscription(subscription.id), t("admin.commerce.notices.cancelSubscription"))}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        {t("admin.commerce.subscriptions.cancelAction")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#3A3A3A]/45">
                    {t("admin.commerce.subscriptions.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5">
          <PageControls page={data.meta.current_page} lastPage={data.meta.last_page} onPage={setPage} />
        </div>
      </AdminPanel>
    </div>
  );
}

function GrantSubscriptionForm({
  plans,
  email,
  setEmail,
  planId,
  setPlanId,
  onSubmit,
}: {
  plans: Array<{ id: string; name: string; price: number; currency: string }>;
  email: string;
  setEmail: (value: string) => void;
  planId: string;
  setPlanId: (value: string) => void;
  onSubmit: (userUuid: string, planId: string) => void;
}) {
  const { t } = useTranslation();
  const [resolving, setResolving] = useState(false);
  const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const lookup = async () => {
    setResolving(true);
    setLookupError(null);
    setResolvedUuid(null);
    try {
      const result = await adminApi.users({ search: email, per_page: 1 });
      const match = result.data.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase());
      if (!match) {
        setLookupError(t("admin.commerce.grant.notFound"));
      } else {
        setResolvedUuid(match.id);
      }
    } catch {
      setLookupError(t("admin.commerce.grant.lookupFailed"));
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="mt-4 grid gap-2.5 rounded-2xl bg-[#FCFCFC] p-4">
      <div className="grid gap-2.5 sm:grid-cols-[1fr_auto]">
        <input
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setResolvedUuid(null);
          }}
          placeholder={t("admin.commerce.grant.emailPh")}
          className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-sm outline-none transition focus:border-[#F47822]"
        />
        <button
          type="button"
          disabled={resolving || !email.trim()}
          onClick={() => void lookup()}
          className="h-11 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-50"
        >
          {resolving ? t("admin.commerce.grant.lookingUp") : t("admin.commerce.grant.findAccount")}
        </button>
      </div>
      {lookupError && <p className="text-xs font-semibold text-red-600">{lookupError}</p>}
      {resolvedUuid && <p className="text-xs font-semibold text-emerald-700">{t("admin.commerce.grant.foundHint")}</p>}
      <select
        value={planId}
        onChange={(event) => setPlanId(event.target.value)}
        className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-semibold outline-none transition focus:border-[#F47822]"
      >
        <option value="">{t("admin.commerce.grant.selectPlan")}</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name} · {plan.price} {plan.currency}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!resolvedUuid || !planId}
        onClick={() => resolvedUuid && onSubmit(resolvedUuid, planId)}
        className="h-11 rounded-xl bg-[#F47822] text-xs font-bold text-white transition hover:bg-[#e96916] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("admin.commerce.grant.grantBtn")}
      </button>
    </div>
  );
}

function PlansTab({ onDone }: { onDone: (work: () => Promise<unknown>, success: string) => void }) {
  const { t } = useTranslation();
  const plans = useQuery({ queryKey: ["admin", "plans"], queryFn: adminApi.plans });
  const [creating, setCreating] = useState(false);

  if (plans.isLoading) return <LoadingAdminPage />;
  if (plans.isError || !plans.data) return <ErrorAdminPage onRetry={() => void plans.refetch()} />;

  return (
    <div className="space-y-6">
      <AdminPanel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.commerce.plans.catalog")}</p>
            <h2 className="mt-1 text-base font-bold">{t("admin.commerce.plans.titleCount", { count: plans.data.length })}</h2>
          </div>
          <button
            type="button"
            onClick={() => setCreating((open) => !open)}
            className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#e96916]"
          >
            {creating ? t("admin.commerce.plans.cancel") : t("admin.commerce.plans.newPlan")}
          </button>
        </div>
        {creating && (
          <PlanForm
            onSubmit={(payload) => {
              setCreating(false);
              onDone(() => adminApi.createPlan(payload), t("admin.commerce.notices.planCreated"));
            }}
          />
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {plans.data.map((plan) => (
            <PlanCard key={plan.id} planId={plan.id} onDone={onDone} />
          ))}
          {plans.data.length === 0 && (
            <p className="text-sm text-[#3A3A3A]/50">{t("admin.commerce.plans.empty")}</p>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}

function PlanCard({
  planId,
  onDone,
}: {
  planId: string;
  onDone: (work: () => Promise<unknown>, success: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const plans = useQuery({ queryKey: ["admin", "plans"], queryFn: adminApi.plans });
  const plan = plans.data?.find((entry) => entry.id === planId);
  const [editing, setEditing] = useState(false);
  if (!plan) return null;

  return (
    <div className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[#3A3A3A]">
            {plan.name}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${plan.active ? "bg-emerald-50 text-emerald-700" : "bg-[#3A3A3A]/8 text-[#3A3A3A]/50"}`}>
              {plan.active ? t("admin.commerce.plans.active") : t("admin.commerce.plans.hidden")}
            </span>
          </p>
          <p className="mt-1 text-xs text-[#3A3A3A]/50">
            {plan.price.toLocaleString(locale)} {plan.currency} / {plan.interval} · {t("admin.commerce.plans.subscribers", { count: plan.subscribers })}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => setEditing((open) => !open)}
            className="rounded-lg border border-[#3A3A3A]/10 px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A]/65 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
          >
            {editing ? t("admin.commerce.plans.close") : t("admin.commerce.plans.edit")}
          </button>
          <button
            type="button"
            onClick={() => onDone(() => adminApi.deletePlan(plan.id), t("admin.commerce.notices.planDeleted"))}
            className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
          >
            {t("admin.commerce.plans.delete")}
          </button>
        </div>
      </div>
      {editing && (
        <PlanForm
          initial={{
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            interval: plan.interval,
            trial_days: plan.trial_days,
            active: plan.active,
          }}
          onSubmit={(payload) => {
            setEditing(false);
            onDone(() => adminApi.updatePlan(plan.id, payload), t("admin.commerce.notices.planUpdated"));
          }}
        />
      )}
    </div>
  );
}

function PlanForm({
  initial,
  onSubmit,
}: {
  initial?: { name: string; price: number; currency: string; interval: string; trial_days: number; active: boolean };
  onSubmit: (payload: Record<string, string | number | boolean | string[] | null>) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [currency, setCurrency] = useState(initial?.currency ?? "DZD");
  const [interval, setInterval] = useState(initial?.interval ?? "month");
  const [trial, setTrial] = useState(initial?.trial_days ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [description, setDescription] = useState("");
  const inputClass = "h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs outline-none transition focus:border-[#F47822]";

  return (
    <div className="mt-4 grid gap-2.5 rounded-2xl bg-[#FCFCFC] p-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("admin.commerce.plans.form.namePh")} className={inputClass} />
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("admin.commerce.plans.form.descPh")} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <input type="number" min={0} value={price} onChange={(event) => setPrice(Number(event.target.value))} placeholder={t("admin.commerce.plans.form.pricePh")} className={inputClass} />
        <input value={currency} onChange={(event) => setCurrency(event.target.value)} placeholder={t("admin.commerce.plans.form.currencyPh")} className={inputClass} />
        <select value={interval} onChange={(event) => setInterval(event.target.value)} className={inputClass}>
          <option value="month">{t("admin.commerce.plans.form.monthly")}</option>
          <option value="year">{t("admin.commerce.plans.form.yearly")}</option>
          <option value="lifetime">{t("admin.commerce.plans.form.lifetime")}</option>
        </select>
        <input type="number" min={0} value={trial} onChange={(event) => setTrial(Number(event.target.value))} placeholder={t("admin.commerce.plans.form.trialPh")} className={inputClass} />
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-[#3A3A3A]/70">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 rounded accent-[#F47822]" />
        {t("admin.commerce.plans.form.visible")}
      </label>
      <button
        type="button"
        disabled={!name.trim()}
        onClick={() => {
          const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const payload: Record<string, string | number | boolean | string[] | null> = {
            price,
            currency: currency.trim() || "DZD",
            interval,
            trial_days: trial,
            active,
          };
          if (!initial) {
            payload.name = name.trim();
            payload.slug = slug;
            if (description.trim()) payload.description = description.trim();
          } else {
            payload.name = name.trim();
            if (description.trim()) payload.description = description.trim();
          }
          onSubmit(payload);
        }}
        className="h-10 rounded-xl bg-[#3A3A3A] text-xs font-bold text-white transition hover:bg-[#F47822] disabled:opacity-50"
      >
        {initial ? t("admin.commerce.plans.form.save") : t("admin.commerce.plans.form.create")}
      </button>
    </div>
  );
}

function RefundsTab() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const refunds = useQuery({ queryKey: ["admin", "commerce", "refunds"], queryFn: adminApi.commerceRefunds });
  if (refunds.isLoading) return <LoadingAdminPage />;
  if (refunds.isError || !refunds.data) return <ErrorAdminPage onRetry={() => void refunds.refetch()} />;
  const data = refunds.data;

  return (
    <AdminPanel>
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.commerce.refunds.tag")}</p>
      <h2 className="mt-1 text-base font-bold">{t("admin.commerce.refunds.titleCount", { count: data.meta.total })}</h2>
      {data.data.length === 0 ? (
        <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("admin.commerce.refunds.empty")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.data.map((refund) => (
            <li key={refund.id} className="flex items-center gap-3 rounded-xl bg-[#FCFCFC] px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-[#3A3A3A]">
                  {refund.user ?? "—"} · {money(refund.amount, refund.currency, locale)}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-[#3A3A3A]/50">
                  {refund.reason ?? t("admin.commerce.refunds.noReason")} · {refund.created_at ? new Date(refund.created_at).toLocaleDateString(locale) : "—"}
                </span>
              </span>
              <StatusPill status={refund.status} />
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}

function PayoutsTab({ onDone }: { onDone: (work: () => Promise<unknown>, success: string) => void }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const payouts = useQuery({ queryKey: ["admin", "commerce", "payouts"], queryFn: adminApi.commercePayouts });
  const instructors = useQuery({ queryKey: ["admin", "instructors", "payout-options"], queryFn: () => adminApi.instructors({ per_page: 100 }) });
  const [formOpen, setFormOpen] = useState(false);
  const [instructorId, setInstructorId] = useState("");
  const [amount, setAmount] = useState(0);
  const [period, setPeriod] = useState("");

  if (payouts.isLoading) return <LoadingAdminPage />;
  if (payouts.isError || !payouts.data) return <ErrorAdminPage onRetry={() => void payouts.refetch()} />;
  const data = payouts.data;

  return (
    <div className="space-y-6">
      <AdminPanel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.commerce.payouts.tag")}</p>
            <h2 className="mt-1 text-base font-bold">{t("admin.commerce.payouts.recordTitle")}</h2>
            <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("admin.commerce.payouts.recordDesc")}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDone(() => adminApi.autoGeneratePayouts(period || undefined), t("admin.commerce.notices.autoGenerate"))}
              className="rounded-xl border border-[#F47822]/20 bg-[#F47822]/10 px-4 py-2.5 text-xs font-bold text-[#F47822] transition hover:bg-[#F47822] hover:text-white"
            >
              {t("admin.commerce.payouts.autoGenerate")}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen((open) => !open)}
              className="rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822]"
            >
              {formOpen ? t("admin.commerce.payouts.cancel") : t("admin.commerce.payouts.newPayout")}
            </button>
          </div>
        </div>
        {formOpen && (
          <div className="mt-4 grid gap-2.5 rounded-2xl bg-[#FCFCFC] p-4 sm:grid-cols-[1fr_140px_140px_auto]">
            <select
              value={instructorId}
              onChange={(event) => setInstructorId(event.target.value)}
              className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-semibold outline-none focus:border-[#F47822]"
            >
              <option value="">{t("admin.commerce.payouts.selectInstructor")}</option>
              {(instructors.data?.data ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} · {entry.email}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              placeholder={t("admin.commerce.payouts.amountPh")}
              className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs outline-none focus:border-[#F47822]"
            />
            <input
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder={t("admin.commerce.payouts.periodPh")}
              className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs outline-none focus:border-[#F47822]"
            />
            <button
              type="button"
              disabled={!instructorId || amount < 1}
              onClick={() => {
                setFormOpen(false);
                onDone(
                  () => adminApi.recordPayout({ instructor_id: instructorId, amount, period: period || undefined }),
                  t("admin.commerce.notices.payoutRecorded"),
                );
              }}
              className="h-11 rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white transition hover:bg-[#e96916] disabled:opacity-50"
            >
              {t("admin.commerce.payouts.record")}
            </button>
          </div>
        )}
      </AdminPanel>

      <AdminPanel>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.commerce.payouts.historyTag")}</p>
        <h2 className="mt-1 text-base font-bold">{t("admin.commerce.payouts.historyTitle", { count: data.meta.total })}</h2>
        {data.data.length === 0 ? (
          <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("admin.commerce.payouts.empty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.data.map((payout) => (
              <li key={payout.id} className="flex items-center gap-3 rounded-xl bg-[#FCFCFC] px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-[#3A3A3A]">
                    {payout.instructor ?? "—"} · {money(payout.amount, payout.currency, locale)}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/50">
                    {payout.period ?? t("admin.commerce.payouts.noPeriod")} · {payout.note ?? ""}
                  </span>
                </span>
                <StatusPill status={payout.status} />
                {payout.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => onDone(() => adminApi.markPayoutPaid(payout.id), t("admin.commerce.notices.payoutPaid"))}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    {t("admin.commerce.payouts.markPaid")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

function OrdersTab() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ["admin", "commerce", "orders", page], queryFn: () => adminApi.commerceOrders({ page, per_page: 10 }) });
  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;
  return (
    <AdminPanel>
      <h2 className="font-semibold">{t("admin.commerce.orders.title")}</h2>
      <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("admin.commerce.orders.desc")}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left rtl:text-right">
          <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
            <tr>
              <th className="pb-3">{t("admin.commerce.orders.headers.order")}</th>
              <th className="pb-3">{t("admin.commerce.orders.headers.customer")}</th>
              <th className="pb-3">{t("admin.commerce.orders.headers.status")}</th>
              <th className="pb-3">{t("admin.commerce.orders.headers.total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]/7">
            {list.data.data.map((o) => (
              <tr key={o.id} className="hover:bg-[#FCFCFC]">
                <td className="py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="py-3 text-xs">{o.user ?? o.email ?? "—"}</td>
                <td className="py-3">
                  <StatusPill status={o.status} />
                </td>
                <td className="py-3 text-xs font-bold">{money(o.total, o.currency, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <PageControls page={list.data.meta.current_page} lastPage={list.data.meta.last_page} onPage={setPage} />
      </div>
    </AdminPanel>
  );
}

function InvoicesTab() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ["admin", "commerce", "invoices", page], queryFn: () => adminApi.commerceInvoices({ page, per_page: 10 }) });
  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;
  return (
    <AdminPanel>
      <h2 className="font-semibold">{t("admin.commerce.invoices.title")}</h2>
      <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("admin.commerce.invoices.desc")}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left rtl:text-right">
          <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
            <tr>
              <th className="pb-3">{t("admin.commerce.invoices.headers.number")}</th>
              <th className="pb-3">{t("admin.commerce.invoices.headers.customer")}</th>
              <th className="pb-3">{t("admin.commerce.invoices.headers.status")}</th>
              <th className="pb-3">{t("admin.commerce.invoices.headers.total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]/7">
            {list.data.data.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#FCFCFC]">
                <td className="py-3 font-mono text-xs">{inv.number ?? inv.id.slice(0, 8)}</td>
                <td className="py-3 text-xs">{inv.user ?? "—"}</td>
                <td className="py-3">
                  <StatusPill status={inv.status} />
                </td>
                <td className="py-3 text-xs font-bold">{money(inv.total, inv.currency, locale)}</td>
              </tr>
            ))}
            {list.data.data.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-[#3A3A3A]/40">
                  {t("admin.commerce.invoices.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <PageControls page={list.data.meta.current_page} lastPage={list.data.meta.last_page} onPage={setPage} />
      </div>
    </AdminPanel>
  );
}

function WebhooksTab({ onDone }: { onDone: (work: () => Promise<unknown>, success: string) => void }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ["admin", "commerce", "webhooks", page], queryFn: () => adminApi.commerceWebhooks({ page, per_page: 10 }) });
  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;
  return (
    <AdminPanel>
      <h2 className="font-semibold">{t("admin.commerce.webhooks.title")}</h2>
      <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("admin.commerce.webhooks.desc")}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left rtl:text-right">
          <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
            <tr>
              <th className="pb-3">{t("admin.commerce.webhooks.headers.provider")}</th>
              <th className="pb-3">{t("admin.commerce.webhooks.headers.event")}</th>
              <th className="pb-3">{t("admin.commerce.webhooks.headers.status")}</th>
              <th className="pb-3 text-right rtl:text-left">{t("admin.commerce.webhooks.headers.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]/7">
            {list.data.data.map((ev) => (
              <tr key={ev.id} className="hover:bg-[#FCFCFC]">
                <td className="py-3 text-xs font-bold capitalize">{ev.provider}</td>
                <td className="py-3 font-mono text-[11px]">{ev.event_type}</td>
                <td className="py-3">
                  <StatusPill status={ev.status} />
                </td>
                <td className="py-3 text-right rtl:text-left">
                  {ev.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => onDone(() => adminApi.replayWebhook(ev.id), t("admin.commerce.notices.webhookReplayed"))}
                      className="rounded-lg bg-[#3A3A3A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#F47822]"
                    >
                      {t("admin.commerce.webhooks.replay")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {list.data.data.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-[#3A3A3A]/40">
                  {t("admin.commerce.webhooks.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <PageControls page={list.data.meta.current_page} lastPage={list.data.meta.last_page} onPage={setPage} />
      </div>
    </AdminPanel>
  );
}

function FailedPaymentsTab() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const list = useQuery({ queryKey: ["admin", "commerce", "failed"], queryFn: adminApi.failedPayments });
  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;
  return (
    <AdminPanel>
      <h2 className="font-semibold">{t("admin.commerce.failed.title")}</h2>
      <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("admin.commerce.failed.desc")}</p>
      {list.data.data.length === 0 ? (
        <p className="mt-4 text-sm text-[#3A3A3A]/40">{t("admin.commerce.failed.empty")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.data.data.map((p) => (
            <li key={p.id} className="rounded-xl bg-[#FCFCFC] px-4 py-3">
              <p className="text-xs font-bold">
                {p.user ?? "—"} · {money(p.amount, p.currency, locale)}
              </p>
              <p className="mt-1 text-[11px] text-red-600">
                {p.failure_code ?? t("admin.commerce.failed.failedFallback")} — {p.failure_message ?? t("admin.commerce.failed.noDetails")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: "green" | "brand" | "red" | "dark" | "amber";
}) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-600",
    brand: "bg-[#F47822]/10 text-[#F47822]",
    red: "bg-red-50 text-red-500",
    dark: "bg-[#3A3A3A]/8 text-[#3A3A3A]",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(58,58,58,.04)]">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/42">{label}</span>
        <span className="mt-0.5 block text-lg font-bold leading-none">{value}</span>
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    succeeded: "bg-emerald-50 text-emerald-700",
    paid: "bg-emerald-50 text-emerald-700",
    completed: "bg-emerald-50 text-emerald-700",
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    past_due: "bg-amber-50 text-amber-700",
    failed: "bg-red-50 text-red-600",
    refunded: "bg-[#3A3A3A]/8 text-[#3A3A3A]/60",
    cancelled: "bg-[#3A3A3A]/8 text-[#3A3A3A]/60",
    disputed: "bg-red-50 text-red-600",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${styles[status] ?? "bg-[#3A3A3A]/8 text-[#3A3A3A]/60"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
