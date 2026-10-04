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
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!stripe || submitting}
        onClick={() => void handlePay()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.22)] hover:bg-[#E96D18] disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {submitting ? t("checkout.processing") : t("checkout.payNow")}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#3A3A3A]/40">
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

  useEffect(() => {
    if (publishableKey) setStripePromise(loadStripe(publishableKey));
  }, [publishableKey]);

  useEffect(() => {
    if (!courseId || orderId) return;
    checkoutApi
      .create({ items: [{ course_id: courseId }], provider: "stripe" })
      .then((res) => {
        if (res.free) {
          navigate(`/courses/${courseId}`, { replace: true });
          return;
        }
        // Persist client_secret for the order-scoped checkout URL
        try {
          sessionStorage.setItem(`checkout:${res.order_id}`, JSON.stringify(res));
        } catch {}
        navigate(`/checkout/${res.order_id}`, { replace: true });
      })
      .catch((e: Error) => setError(e.message));
  }, [courseId, orderId, navigate]);

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
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        <Link to="/catalog" className="mt-4 inline-block text-sm font-bold text-[#F47822]">
          {t("checkout.backCatalog")}
        </Link>
      </main>
    );
  }

  if (!orderId) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F47822]" />
          <p className="mt-4 text-sm font-semibold text-[#3A3A3A]">{t("checkout.preparing")}</p>
          <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("checkout.walletsNote")}</p>
        </div>
      </main>
    );
  }

  // Prefer persisted checkout, fallback to order's client_secret
  const clientSecret = checkout?.client_secret ?? null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_12px_40px_rgba(58,58,58,.06)] sm:p-8">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3A3A]">
          <Wallet className="h-5 w-5 text-[#F47822]" /> {t("checkout.title")}
        </h1>
        <p className="mt-1 text-sm text-[#3A3A3A]/55">{t("checkout.orderHint", { id: orderId.slice(0, 8) })}</p>

        {!publishableKey || !clientSecret ? (
          <div className="mt-6">
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
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
