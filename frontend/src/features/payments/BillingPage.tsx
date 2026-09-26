import {
    AlertTriangle,
    CreditCard,
    Download,
    FileText,
    Loader2,
    Package,
    Plus,
    Receipt,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
    billingApi,
    downloadInvoice,
    type BillingInvoice,
    type BillingOrder,
    type BillingPaymentMethod,
    type BillingSubscription,
} from "./billing";
import { PaymentBrandIcon } from "./components/PaymentBrandIcon";

type BillingData = {
    orders: BillingOrder[];
    invoices: BillingInvoice[];
    subscriptions: BillingSubscription[];
    methods: BillingPaymentMethod[];
};

const emptyData: BillingData = { orders: [], invoices: [], subscriptions: [], methods: [] };

function statusChip(status: string): string {
    if (["paid", "succeeded", "active"].includes(status)) {
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    }
    if (["pending", "processing", "open", "requires_action", "trial"].includes(status)) {
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400";
    }
    if (["failed", "void", "cancelled"].includes(status)) {
        return "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400";
    }
    return "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60";
}

function SectionHeading({
    icon,
    title,
    hint,
}: {
    icon: React.ReactNode;
    title: string;
    hint?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-hbt-dark dark:text-white">
                    <span className="text-[#F47822]">{icon}</span>
                    {title}
                </h2>
                {hint ? (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
                ) : null}
            </div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <p
            className="rounded-2xl border border-dashed border-[#E6E6E6] dark:border-white/10 px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
            data-testid="billing-empty"
        >
            {text}
        </p>
    );
}

function methodLabel(method: BillingPaymentMethod): string {
    const brand =
        method.brand === "tamara"
            ? "Tamara"
            : (method.brand ?? method.type).replace(/_/g, " ");
    return method.last_four ? `${brand} ···· ${method.last_four}` : brand;
}

export function BillingPage() {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState<BillingData>(emptyData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [addingMethod, setAddingMethod] = useState(false);
    const [methodActionId, setMethodActionId] = useState<string | null>(null);
    const [methodForm, setMethodForm] = useState({ brand: "visa", last_four: "", exp_month: "12", exp_year: "2030" });
    const [methodError, setMethodError] = useState<string | null>(null);

    const formatDate = (value: string | null) =>
        value
            ? new Intl.DateTimeFormat(i18n.language, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
              }).format(new Date(value))
            : "—";

    const money = (amount: number, currency: string) => `${amount.toLocaleString()} ${currency}`;

    useEffect(() => {
        Promise.all([
            billingApi.orders(),
            billingApi.invoices(),
            billingApi.subscriptions(),
            billingApi.paymentMethods(),
        ])
            .then(([orders, invoices, subscriptions, methods]) => {
                setData({ orders, invoices, subscriptions, methods });
            })
            .catch((reason: unknown) => {
                setError(
                    reason instanceof Error ? reason.message : t("billing.loadFail"),
                );
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeSubscription =
        data.subscriptions.find((subscription) => subscription.status === "active" || subscription.status === "trial") ??
        data.subscriptions[0];

    const handleDownload = async (invoice: BillingInvoice) => {
        setDownloadingId(invoice.id);
        try {
            await downloadInvoice(invoice);
        } catch {
            setError(t("billing.invoiceDownloadFail"));
        } finally {
            setDownloadingId(null);
        }
    };

    const isTamara = methodForm.brand === "tamara";

    const handleAddMethod = async (event: React.FormEvent) => {
        event.preventDefault();
        setMethodError(null);
        setAddingMethod(true);
        try {
            const created = await billingApi.addPaymentMethod(
                isTamara
                    ? { provider: "tamara", type: "tamara", brand: "tamara" }
                    : {
                          provider: "stripe",
                          type: "card",
                          brand: methodForm.brand,
                          last_four: methodForm.last_four.padStart(4, "0"),
                          exp_month: Number(methodForm.exp_month),
                          exp_year: Number(methodForm.exp_year),
                      },
            );
            setData((previous) => ({ ...previous, methods: [created, ...previous.methods] }));
            setMethodForm({ brand: "visa", last_four: "", exp_month: "12", exp_year: "2030" });
        } catch (reason: unknown) {
            setMethodError(reason instanceof Error ? reason.message : t("billing.methodFail"));
        } finally {
            setAddingMethod(false);
        }
    };

    const handleSetDefault = async (method: BillingPaymentMethod) => {
        setMethodActionId(method.id);
        setError(null);
        try {
            await billingApi.setDefaultPaymentMethod(method.id);
            setData((previous) => ({
                ...previous,
                methods: previous.methods.map((entry) => ({
                    ...entry,
                    is_default: entry.id === method.id,
                })),
            }));
        } catch (reason: unknown) {
            setError(
                reason instanceof Error ? reason.message : t("billing.methods.defaultFail"),
            );
        } finally {
            setMethodActionId(null);
        }
    };

    const handleRemove = async (method: BillingPaymentMethod) => {
        setMethodActionId(method.id);
        setError(null);
        try {
            await billingApi.removePaymentMethod(method.id);
            setData((previous) => ({
                ...previous,
                methods: previous.methods.filter((entry) => entry.id !== method.id),
            }));
        } catch (reason: unknown) {
            setError(
                reason instanceof Error ? reason.message : t("billing.methods.removeFail"),
            );
        } finally {
            setMethodActionId(null);
        }
    };

    if (loading) {
        return (
            <div
                className="flex items-center gap-2 p-8 text-sm text-[#3A3A3A]/55 dark:text-white/55"
                data-testid="billing-loading"
            >
                <Loader2 className="h-4 w-4 animate-spin" /> {t("billing.loading")}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6" data-testid="billing-page">
            <section className="rounded-3xl border border-[#E6E6E6] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b20] sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F47822]">
                            {t("billing.eyebrow")}
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-hbt-dark dark:text-white">
                            {t("billing.title")}
                        </h1>
                        <p className="mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                            {t("billing.description")}
                        </p>
                    </div>
                    <div className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-[#E6E6E6] bg-[#FAFAFA] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822] text-white">
                            <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                {t("billing.totalsPaid")}
                            </p>
                            <p className="mt-0.5 text-lg font-bold leading-none text-hbt-dark dark:text-white">
                                {money(
                                    data.orders
                                        .filter((order) => order.status === "paid")
                                        .reduce((sum, order) => sum + order.total, 0),
                                    data.orders[0]?.currency ?? "DZD",
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div
                        className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                        role="alert"
                        data-testid="billing-error"
                    >
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                ) : null}
            </section>

            {/* Subscription */}
            <section className="mt-6 rounded-3xl border border-[#E6E6E6] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
                <SectionHeading
                    icon={<FileText className="h-4 w-4" />}
                    title={t("billing.subscription.title")}
                    hint={t("billing.subscription.hint")}
                />
                <div className="mt-4" data-testid="billing-subscription">
                    {activeSubscription ? (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="rounded-full bg-[#F47822] px-3 py-1 text-xs font-bold text-white">
                                    {activeSubscription.plan ?? t("billing.subscription.planFallback")}
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusChip(activeSubscription.status)}`}
                                >
                                    {activeSubscription.status}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {activeSubscription.current_period_ends_at
                                        ? t("billing.subscription.renews", {
                                              date: formatDate(activeSubscription.current_period_ends_at),
                                          })
                                        : t("billing.subscription.noRenewal")}
                                </span>
                            </div>
                            <Link
                                to="/subscription"
                                className="inline-flex items-center justify-center rounded-xl border border-[#F47822]/30 px-4 py-2 text-sm font-semibold text-[#F47822] hover:bg-[#F47822]/5"
                            >
                                {t("billing.subscription.manage")}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t("billing.subscription.none")}
                            </p>
                            <Link
                                to="/pricing"
                                className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F47822]/90"
                            >
                                {t("billing.subscription.browse")}
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Orders */}
            <section className="mt-6 rounded-3xl border border-[#E6E6E6] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
                <SectionHeading
                    icon={<Package className="h-4 w-4" />}
                    title={t("billing.orders.title")}
                    hint={t("billing.orders.hint")}
                />
                <div className="mt-4 space-y-3" data-testid="billing-orders">
                    {data.orders.length === 0 ? (
                        <EmptyState text={t("billing.orders.empty")} />
                    ) : (
                        data.orders.map((order) => (
                            <div
                                key={order.id}
                                className="flex flex-col gap-3 rounded-2xl border border-[#E6E6E6] bg-[#FAFAFA]/60 px-4 py-3.5 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                                data-testid={`billing-order-${order.id}`}
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-hbt-dark dark:text-white">
                                        {order.items.map((item) => item.title).join(", ") || t("billing.orders.itemFallback")}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {formatDate(order.placed_at)} · {order.provider} ·{" "}
                                        {t(`billing.status.${order.status}`, { defaultValue: order.status })}
                                    </p>
                                    {order.payment?.failure_message ? (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {order.payment.failure_message}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-3 sm:justify-end">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusChip(order.status)}`}
                                    >
                                        {t(`billing.status.${order.status}`, { defaultValue: order.status })}
                                    </span>
                                    <span className="w-[110px] text-right text-sm font-bold text-hbt-dark dark:text-white">
                                        {money(order.total, order.currency)}
                                    </span>
                                    {order.status === "pending" ? (
                                        <Link
                                            to={`/checkout/${order.id}`}
                                            className="rounded-xl bg-[#F47822] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#F47822]/90"
                                            data-testid={`billing-order-pay-${order.id}`}
                                        >
                                            {t("billing.orders.completePayment")}
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Invoices */}
            <section className="mt-6 rounded-3xl border border-[#E6E6E6] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
                <SectionHeading
                    icon={<Receipt className="h-4 w-4" />}
                    title={t("billing.invoices.title")}
                    hint={t("billing.invoices.hint")}
                />
                <div className="mt-4 space-y-3" data-testid="billing-invoices">
                    {data.invoices.length === 0 ? (
                        <EmptyState text={t("billing.invoices.empty")} />
                    ) : (
                        data.invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex flex-col gap-3 rounded-2xl border border-[#E6E6E6] bg-[#FAFAFA]/60 px-4 py-3.5 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                                data-testid={`billing-invoice-${invoice.id}`}
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-hbt-dark dark:text-white">
                                        {invoice.number ?? t("billing.invoices.numberFallback")}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {t("billing.invoices.issued", {
                                            date: formatDate(invoice.issued_at ?? invoice.paid_at),
                                        })}{" "}
                                        · {invoice.provider}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 sm:justify-end">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusChip(invoice.status)}`}
                                    >
                                        {t(`billing.status.${invoice.status}`, { defaultValue: invoice.status })}
                                    </span>
                                    <span className="w-[110px] text-right text-sm font-bold text-hbt-dark dark:text-white">
                                        {money(invoice.total, invoice.currency)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => void handleDownload(invoice)}
                                        disabled={downloadingId === invoice.id}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#F47822]/30 px-3.5 py-2 text-xs font-semibold text-[#F47822] hover:bg-[#F47822]/5 disabled:opacity-60"
                                        data-testid={`invoice-download-${invoice.id}`}
                                    >
                                        {downloadingId === invoice.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Download className="h-3.5 w-3.5" />
                                        )}
                                        {t("billing.invoices.download")}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Payment methods */}
            <section className="mt-6 rounded-3xl border border-[#E6E6E6] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
                <SectionHeading
                    icon={<CreditCard className="h-4 w-4" />}
                    title={t("billing.methods.title")}
                    hint={t("billing.methods.hint")}
                />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3" data-testid="billing-payment-methods">
                        {data.methods.length === 0 ? (
                            <EmptyState text={t("billing.methods.empty")} />
                        ) : (
                            data.methods.map((method) => (
                                <div
                                    key={method.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6E6E6] bg-[#FAFAFA]/60 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                                    data-testid={`billing-method-${method.id}`}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <PaymentBrandIcon brand={method.brand} type={method.type} />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold capitalize text-hbt-dark dark:text-white">
                                                {methodLabel(method)}
                                            </p>
                                            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                                                {method.provider ?? method.type}
                                                {method.exp_month && method.exp_year
                                                    ? ` · ${String(method.exp_month).padStart(2, "0")}/${method.exp_year}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {method.is_default ? (
                                            <span
                                                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                data-testid={`method-default-chip-${method.id}`}
                                            >
                                                {t("billing.methods.default")}
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => void handleSetDefault(method)}
                                                disabled={methodActionId !== null}
                                                className="rounded-full border border-[#F47822]/40 px-3 py-1 text-xs font-bold text-[#F47822] hover:bg-[#F47822]/5 disabled:opacity-50"
                                                data-testid={`method-set-default-${method.id}`}
                                            >
                                                {methodActionId === method.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    t("billing.methods.setDefault")
                                                )}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => void handleRemove(method)}
                                            disabled={methodActionId !== null}
                                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                                            data-testid={`method-remove-${method.id}`}
                                        >
                                            {methodActionId === method.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                t("billing.methods.remove")
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form
                        onSubmit={handleAddMethod}
                        className="rounded-2xl border border-dashed border-[#E6E6E6] p-4 dark:border-white/10"
                        data-testid="billing-method-form"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            {t("billing.methods.addTitle")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t("billing.methods.addNote")}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <label className="col-span-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {t("billing.methods.brand")}
                                <select
                                    value={methodForm.brand}
                                    onChange={(event) =>
                                        setMethodForm((previous) => ({ ...previous, brand: event.target.value }))
                                    }
                                    className="mt-1 w-full rounded-xl border border-[#E6E6E6] bg-white px-3 py-2 text-sm text-hbt-dark dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                    data-testid="method-brand"
                                >
                                    <option value="visa">Visa</option>
                                    <option value="mastercard">Mastercard</option>
                                    <option value="amex">Amex</option>
                                    <option value="tamara">Tamara</option>
                                </select>
                            </label>
                            {isTamara ? (
                                <p className="col-span-2 rounded-xl bg-[#5300BA]/5 px-3 py-2 text-xs leading-5 text-[#5300BA]">
                                    {t("billing.methods.tamaraNote")}
                                </p>
                            ) : null}
                            {!isTamara && (
                            <>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {t("billing.methods.lastFour")}
                                <input
                                    value={methodForm.last_four}
                                    onChange={(event) =>
                                        setMethodForm((previous) => ({
                                            ...previous,
                                            last_four: event.target.value.replace(/\D/g, "").slice(0, 4),
                                        }))
                                    }
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="4242"
                                    className="mt-1 w-full rounded-xl border border-[#E6E6E6] bg-white px-3 py-2 text-sm text-hbt-dark dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                    data-testid="method-last4"
                                />
                            </label>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {t("billing.methods.expiry")}
                                <div className="mt-1 flex gap-2">
                                    <input
                                        value={methodForm.exp_month}
                                        onChange={(event) =>
                                            setMethodForm((previous) => ({
                                                ...previous,
                                                exp_month: event.target.value.replace(/\D/g, "").slice(0, 2),
                                            }))
                                        }
                                        inputMode="numeric"
                                        maxLength={2}
                                        placeholder="12"
                                        className="w-full rounded-xl border border-[#E6E6E6] bg-white px-3 py-2 text-sm text-hbt-dark dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                        data-testid="method-exp-month"
                                    />
                                    <input
                                        value={methodForm.exp_year}
                                        onChange={(event) =>
                                            setMethodForm((previous) => ({
                                                ...previous,
                                                exp_year: event.target.value.replace(/\D/g, "").slice(0, 4),
                                            }))
                                        }
                                        inputMode="numeric"
                                        maxLength={4}
                                        placeholder="2030"
                                        className="w-full rounded-xl border border-[#E6E6E6] bg-white px-3 py-2 text-sm text-hbt-dark dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                        data-testid="method-exp-year"
                                    />
                                </div>
                            </label>
                            </>
                            )}
                        </div>
                        {methodError ? (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                                {methodError}
                            </p>
                        ) : null}
                        <button
                            type="submit"
                            disabled={addingMethod || (!isTamara && methodForm.last_four.length !== 4)}
                            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#F47822]/90 disabled:opacity-50"
                            data-testid="method-add-submit"
                        >
                            {addingMethod ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            {isTamara ? t("billing.methods.addBnpl") : t("billing.methods.add")}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
