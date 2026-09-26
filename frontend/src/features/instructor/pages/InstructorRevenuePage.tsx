import { useQuery } from "@tanstack/react-query";
import { Banknote, HandCoins, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { checkoutApi } from "@/features/payments/api";
import { AdminPanel, LoadingAdminPage, ErrorAdminPage } from "@/features/admin/components/AdminUi";

export function InstructorRevenuePage() {
  const { t } = useTranslation();
  const revenue = useQuery({ queryKey: ["instructor", "revenue"], queryFn: checkoutApi.instructorRevenue });

  if (revenue.isLoading) return <LoadingAdminPage />;
  if (revenue.isError || !revenue.data) return <ErrorAdminPage onRetry={() => void revenue.refetch()} title={t("instructor.revenue.loadFail")} retryLabel={t("instructor.revenue.retry")} />;

  const data = revenue.data as {
    gross_revenue: number;
    net_revenue: number;
    total_sales: number;
    currency: string;
    courses: Array<{ id: string; title: string; sales: number; price: number }>;
    payouts: Array<{ id: string; amount: number; currency: string; period: string | null; status: string; paid_at: string | null }>;
    pending_payout: number;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="rounded-3xl bg-[#3A3A3A] p-6 text-white sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F9A16C]">{t("instructor.revenue.eyebrow")}</p>
        <h1 className="mt-2 text-2xl font-bold">{t("instructor.revenue.title")}</h1>
        <p className="mt-1 text-sm text-white/60">{t("instructor.revenue.description")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label={t("instructor.revenue.gross")} value={`${data.gross_revenue.toLocaleString()} ${data.currency}`} icon={<TrendingUp className="h-4 w-4" />} />
          <Stat label={t("instructor.revenue.net")} value={`${data.net_revenue.toLocaleString()} ${data.currency}`} icon={<Banknote className="h-4 w-4" />} />
          <Stat label={t("instructor.revenue.sales")} value={data.total_sales} icon={<HandCoins className="h-4 w-4" />} />
        </div>
        {data.pending_payout > 0 && (
          <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm">
            {t("instructor.revenue.pending", { amount: data.pending_payout.toLocaleString(), currency: data.currency })}
          </p>
        )}
      </div>

      <AdminPanel>
        <h2 className="font-semibold">{t("instructor.revenue.perCourse")}</h2>
        {data.courses.length === 0 ? (
          <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("instructor.revenue.noSales")}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.courses.map((c) => (
              <div key={c.id} className="rounded-xl bg-[#FCFCFC] p-4">
                <p className="text-sm font-bold">{c.title}</p>
                <p className="mt-1 text-xs text-[#3A3A3A]/50">
                  {t("instructor.revenue.salesCount", { count: c.sales, price: c.price, currency: data.currency })}
                </p>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      <AdminPanel>
        <h2 className="font-semibold">{t("instructor.revenue.payouts")}</h2>
        {data.payouts.length === 0 ? (
          <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("instructor.revenue.noPayouts")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#FCFCFC] px-4 py-3">
                <span className="text-xs font-bold">
                  {p.period ?? "—"} · {p.amount.toLocaleString()} {p.currency}
                </span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${p.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white/45">
        {icon} {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
