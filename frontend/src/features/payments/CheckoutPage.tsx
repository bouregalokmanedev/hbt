import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { env } from "@/config/env";
import { checkoutApi } from "./api";

// Stripe is loaded lazily; publishable key comes from backend /config endpoint or env
function usePublishableKey() {
  const [key, setKey] = useState<string | null>(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? null);
  useEffect(() => {
    if (key) return;
    fetch(`${env.apiUrl}/v1/config/stripe-key`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const k = d?.data?.publishable_key ?? d?.publishable_key ?? null;
        if (k) setKey(k);
      })
      .catch(() => {});
  }, [key]);
  return key;
}

function CheckoutForm({
  clientSecret,
  orderId,
  onSuccess,
}: {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/${orderId}/success` },
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message ?? t("checkout.payFailed"));
      setSubmitting(false);
      return;
    }
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
          // Apple Pay / Google Pay render as wallets on top of card.
          // "auto" shows each wallet only in a browser that supports it
          // (Apple Pay → Safari, Google Pay → Chrome).
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      {error && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="button"
        disabled={!stripe || submitting}
        onClick={() => void handlePay()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.22)] hover:bg-[#E96D18] disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {submitting ? t("checkout.processing") : t("checkout.payNow")}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
        <ShieldCheck className="h-3.5 w-3.5" /> {t("checkout.secureNote")}
      </p>
    </div>
  );
}

export function CheckoutPage() {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("course");
  const publishableKey = usePublishableKey();
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [checkout, setCheckout] = useState<{ order_id: string; payment_id?: string; client_secret?: string; status: string; free?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [coupon, setCoupon] = useState(() => searchParams.get("coupon") ?? "");
  const [couponState, setCouponState] = useState<{ ok: boolean; name?: string; message?: string } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (publishableKey) setStripePromise(loadStripe(publishableKey));
  }, [publishableKey]);

  const startCheckout = async (code?: string) => {
    if (!courseId || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await checkoutApi.create({
        items: [{ course_id: courseId }],
        provider: "stripe",
        ...(code?.trim() ? { coupon_code: code.trim().toUpperCase() } : {}),
      });
      if (res.free) {
        navigate(`/courses/${courseId}`, { replace: true });
        return;
      }
      // Persist client_secret for the order-scoped checkout URL
      try {
        sessionStorage.setItem(`checkout:${res.order_id}`, JSON.stringify(res));
      } catch {}
      navigate(`/checkout/${res.order_id}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("checkout.payFailed"));
    } finally {
      setCreating(false);
    }
  };

  const checkCoupon = async () => {
    if (!coupon.trim() || !courseId) return;
    setCouponChecking(true);
    setCouponState(null);
    try {
      const result = await checkoutApi.validateCoupon(coupon.trim(), [courseId]);
      setCouponState({ ok: true, name: result.name });
    } catch {
      setCouponState({ ok: false, message: t("checkout.couponInvalid") });
    } finally {
      setCouponChecking(false);
    }
  };

  // ?coupon= links (marketer emails, broadcasts) validate immediately.
  useEffect(() => {
    const preset = searchParams.get("coupon");
    if (preset && courseId && !orderId) {
      setCoupon(preset);
      void checkoutApi
        .validateCoupon(preset, [courseId])
        .then((result) => setCouponState({ ok: true, name: result.name }))
        .catch(() => setCouponState({ ok: false, message: t("checkout.couponInvalid") }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, orderId]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    // Hydrate client_secret: prefer persisted checkout, then backend order
    const raw = sessionStorage.getItem(`checkout:${orderId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.client_secret) {
          setCheckout(parsed);
        }
      } catch {}
    }
    const fetchOrder = async () => {
      try {
        const data = await checkoutApi.getOrder(orderId);
        if (cancelled) return;
        if (data.status === "paid" || data.payments?.some((p) => p.status === "succeeded")) {
          navigate(`/checkout/${orderId}/success`, { replace: true });
          return;
        }
        if (data.client_secret) {
          setCheckout((prev) =>
            prev?.client_secret ? prev : { order_id: data.id, client_secret: data.client_secret ?? undefined, status: data.status },
          );
        }
      } catch {}
    };
    void fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId, navigate]);

  const confirmPaid = async () => {
    if (!orderId) return;
    setPolling(true);
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const data = await checkoutApi.getOrder(orderId);
        if (data.status === "paid") {
          navigate(`/checkout/${orderId}/success`, { replace: true });
          return;
        }
      } catch {}
    }
    setPolling(false);
  };

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link to="/catalog" className="mt-4 inline-block text-sm font-bold text-[#F47822]">
          {t("checkout.backCatalog")}
        </Link>
      </main>
    );
  }

  if (!orderId) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-[0_12px_40px_rgba(58,58,58,.06)] sm:p-8">
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
            <Wallet className="h-5 w-5 text-[#F47822]" /> {t("checkout.title")}
          </h1>

          <label className="mt-6 block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
            {t("checkout.couponLabel")}
            <span className="mt-2 flex gap-2">
              <input
                value={coupon}
                onChange={(event) => {
                  setCoupon(event.target.value.toUpperCase().replace(/\s+/g, ""));
                  setCouponState(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void checkCoupon();
                  }
                }}
                placeholder={t("checkout.couponPh")}
                dir="ltr"
                maxLength={40}
                className="h-11 min-w-0 flex-1 rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 font-mono text-sm outline-none focus:border-[#F47822] dark:border-white/10 dark:bg-white/5"
              />
              <button
                type="button"
                onClick={() => void checkCoupon()}
                disabled={couponChecking || !coupon.trim()}
                className="h-11 shrink-0 rounded-xl border border-[#F47822]/30 px-4 text-xs font-bold text-[#F47822] transition hover:bg-[#F47822]/10 disabled:opacity-50"
              >
                {couponChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : t("checkout.couponApply")}
              </button>
            </span>
          </label>
          {couponState?.ok && (
            <p className="mt-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />
              {t("checkout.couponApplied", { name: couponState.name ?? coupon.trim().toUpperCase() })}
            </p>
          )}
          {couponState && !couponState.ok && (
            <p role="alert" className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {couponState.message}
            </p>
          )}

          <button
            type="button"
            onClick={() => void startCheckout(couponState?.ok ? coupon : undefined)}
            disabled={creating || couponChecking}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.22)] hover:bg-[#E96D18] disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {t("checkout.couponContinue")}
          </button>
          <button
            type="button"
            onClick={() => void startCheckout(undefined)}
            disabled={creating}
            className="mt-2 w-full py-1 text-center text-xs font-bold text-[#3A3A3A]/50 hover:text-[#F47822] disabled:opacity-50 dark:text-white/50"
          >
            {t("checkout.couponSkip")}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("checkout.secureNote")}
          </p>
        </div>
      </main>
    );
  }

  // Prefer persisted checkout, fallback to order's client_secret
  const clientSecret = checkout?.client_secret ?? null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-[0_12px_40px_rgba(58,58,58,.06)] sm:p-8">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
          <Wallet className="h-5 w-5 text-[#F47822]" /> {t("checkout.title")}
        </h1>
        <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("checkout.orderHint", { id: orderId.slice(0, 8) })}</p>

        {!publishableKey || !clientSecret ? (
          <div className="mt-6">
            <p className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              {t("checkout.stubNote")}
            </p>
            <button
              type="button"
              onClick={() => void confirmPaid()}
              disabled={polling}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3A3A3A] text-sm font-bold text-white hover:bg-black disabled:opacity-60"
            >
              {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {polling ? t("checkout.waiting") : t("checkout.paidCheck")}
            </button>
            <Link to={`/courses/${courseId ?? ""}`} className="mt-3 block text-center text-xs font-bold text-[#F47822]">
              {t("checkout.backCourse")}
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
              <CheckoutForm clientSecret={clientSecret} orderId={orderId} onSuccess={() => void confirmPaid()} />
            </Elements>
          </div>
        )}
      </div>
    </main>
  );
}

export function CheckoutSuccessPage() {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="rounded-3xl bg-[#3A3A3A] p-8 text-center text-white">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#F47822]" />
        <h1 className="mt-4 text-2xl font-bold">{t("checkout.successTitle")}</h1>
        <p className="mt-2 text-sm text-white/60">{t("checkout.successHint", { id: orderId?.slice(0, 8) ?? "" })}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/my-courses" className="rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E96D18]">
            {t("checkout.goMyCourses")}
          </Link>
          <Link to="/catalog" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">
            {t("checkout.exploreMore")}
          </Link>
        </div>
      </div>
    </main>
  );
}
