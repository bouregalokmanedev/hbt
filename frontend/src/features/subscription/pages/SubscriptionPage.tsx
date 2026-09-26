import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Check, X, AlertTriangle, CreditCard, Calendar, Zap, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  trial_days: number;
  features: string[] | null;
  active: boolean;
}

interface Subscription {
  id: string;
  plan: string | null;
  status: string;
  current_period_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? "Request failed");
  return (body?.data ?? body) as T;
}

export function SubscriptionPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const fmtDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(i18n.language) : t("subscription.noDate");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansData, subsData] = await Promise.all([
        api<Plan[]>("/v1/plans"),
        api<Subscription[]>("/v1/subscriptions"),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("subscription.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeSub = subscriptions.find((s) => ["active", "trial", "pending"].includes(s.status));
  const isActive = activeSub && ["active", "trial"].includes(activeSub.status);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      window.location.href = "/login?next=/subscription";
      return;
    }
    setActionLoading(planId);
    try {
      await api("/v1/subscriptions", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId, provider: "stripe" }),
      });
      toast.success(t("subscription.created"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("subscription.createFail"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (subId: string) => {
    if (!confirm(t("subscription.confirmCancel"))) return;
    setActionLoading(subId);
    try {
      await api(`/v1/subscriptions/${subId}/cancel`, { method: "POST" });
      toast.success(t("subscription.cancelled"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("subscription.cancelFail"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (subId: string, newPlanId: string) => {
    setActionLoading(subId);
    try {
      await api(`/v1/subscriptions/${subId}/change-plan`, {
        method: "POST",
        body: JSON.stringify({ plan_id: newPlanId }),
      });
      toast.success(t("subscription.changed"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("subscription.changeFail"));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-full bg-background p-8">
        <div className="mx-auto max-w-[1440px] space-y-4">
          <div className="h-32 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
          <div className="h-64 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        {/* Header */}
        <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] p-7 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("subscription.header.eyebrow")}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold">
                <Crown className="h-6 w-6 text-[#F47822]" /> {t("subscription.header.title")}
              </h1>
              <p className="mt-1 text-sm text-white/60">{t("subscription.header.description")}</p>
            </div>
            <div className="flex min-w-[142px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,0.25)]"><Crown className="h-5 w-5" /></div>
              <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{t("subscription.header.current")}</p><p className="mt-0.5 truncate text-lg font-bold leading-none text-white">{activeSub?.plan ?? t("subscription.header.none")}</p></div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Active subscription */}
        {activeSub ? (
          <section className="mt-6 rounded-3xl border border-[#F47822]/20 bg-white dark:bg-[#1b1b20] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#F47822] px-3 py-1 text-xs font-bold text-white">{activeSub.plan ?? t("subscription.planFallback")}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {activeSub.status}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-hbt-dark dark:text-white">{t("subscription.onPlan", { plan: activeSub.plan ?? t("subscription.yourPlanFallback") })}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  {activeSub.status === "trial"
                    ? t("subscription.trialEnds", { date: fmtDate(activeSub.current_period_ends_at) })
                    : t("subscription.renews", { date: fmtDate(activeSub.current_period_ends_at) })}
                </p>
                {activeSub.cancelled_at && (
                  <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">{t("subscription.cancelledNote")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {!activeSub.cancelled_at && (
                  <button
                    onClick={() => void handleCancel(activeSub.id)}
                    disabled={!!actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-[#1b1b20] px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {actionLoading === activeSub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    {t("subscription.cancelBtn")}
                  </button>
                )}
                <Link to="/pricing" className="text-center text-xs font-semibold text-hbt-orange hover:underline">
                  {t("subscription.viewPlans")}
                </Link>
              </div>
            </div>

            {/* Change plan */}
            <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-hbt-dark dark:text-white">
                <Zap className="h-4 w-4 text-hbt-orange" /> {t("subscription.changePlan")}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {plans
                  .filter((p) => p.slug !== "starter" && p.active)
                  .map((plan) => (
                    <div key={plan.id} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
                      <p className="text-sm font-bold">{plan.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description ?? ""}</p>
                      <p className="mt-2 text-lg font-bold">
                        {plan.price === 0 ? t("subscription.free") : `${plan.price} ${plan.currency}`} <span className="text-xs font-normal text-slate-400">/ {plan.interval}</span>
                      </p>
                      {plan.trial_days > 0 && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{t("subscription.trialDays", { count: plan.trial_days })}</p>}
                      <button
                        onClick={() => void handleChangePlan(activeSub.id, plan.id)}
                        disabled={!!actionLoading}
                        className="mt-3 w-full rounded-xl bg-hbt-dark px-3 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
                      >
                        {actionLoading === activeSub.id ? t("subscription.switching") : t("subscription.switchTo", { plan: plan.name })}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-hbt-orange">
              <Crown className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold">{t("subscription.emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t("subscription.emptyDesc")}
            </p>
            <Link to="/pricing" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-hbt-orange px-6 py-3 text-sm font-bold text-white hover:bg-[#e96916]">
              {t("subscription.explorePlans")} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </section>
        )}

        {/* Available plans grid */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-hbt-orange" /> {t("subscription.gridTitle")}
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = activeSub?.plan?.toLowerCase() === plan.name.toLowerCase();
              return (
                <article
                  key={plan.id}
                  className={`flex flex-col rounded-3xl border p-6 transition hover:-translate-y-1 hover:shadow-xl ${
                    isCurrent ? "border-hbt-orange bg-orange-50 dark:bg-orange-500/10" : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b20]"
                  }`}
                >
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price === 0 ? t("subscription.free") : `${plan.price}`}</span>
                    {plan.price > 0 && <span className="text-sm text-slate-400"> {plan.currency} / {plan.interval}</span>}
                  </div>
                  {plan.trial_days > 0 && <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t("subscription.trialDaysFree", { count: plan.trial_days })}</p>}
                  <ul className="mt-4 flex-1 space-y-2">
                    {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map((f) => (
                      <li key={f} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => void handleSubscribe(plan.id)}
                    disabled={!!actionLoading || isCurrent}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isCurrent
                        ? "bg-slate-100 dark:bg-white/10 text-slate-400"
                        : plan.slug.includes("academy")
                          ? "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-hbt-dark dark:text-white hover:border-hbt-orange"
                          : "bg-hbt-orange text-white hover:bg-[#e96916]"
                    } disabled:opacity-50`}
                  >
                    {actionLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      t("subscription.currentPlan")
                    ) : plan.price === 0 ? (
                      t("subscription.current")
                    ) : (
                      t("subscription.subscribe")
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* History */}
        {subscriptions.length > 1 && (
          <section className="mt-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <CreditCard className="h-4 w-4 text-hbt-orange" /> Subscription history
            </h3>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
              {subscriptions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold">{s.plan ?? t("subscription.planFallbackRow")}</p>
                    <p className="text-xs text-slate-400">{s.created_at ? new Date(s.created_at).toLocaleDateString(i18n.language) : ""}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-bold capitalize">{s.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
