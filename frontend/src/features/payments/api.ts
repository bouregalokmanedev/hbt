import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

export interface CheckoutPayload {
  items: Array<{ course_id: string }>;
  provider?: string;
  currency?: string;
}

export interface CheckoutResult {
  order_id: string;
  payment_id?: string;
  provider: string;
  provider_payment_id?: string;
  status: string;
  amount: number;
  currency: string;
  client_secret?: string;
  free?: boolean;
}

export async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  if (!res.ok) throw new Error(body?.message ?? "Request failed.");
  return (body?.data ?? body) as T;
}

export const checkoutApi = {
  create: (payload: CheckoutPayload) => authedFetch<CheckoutResult>("/v1/checkout", { method: "POST", body: JSON.stringify(payload) }),
  getOrder: (id: string) =>
    authedFetch<{
      id: string;
      status: string;
      total: number;
      currency: string;
      client_secret?: string | null;
      payments: Array<{ status: string }>;
    }>(`/v1/checkout/${id}`),
  paymentMethods: () => authedFetch<Array<{ id: string; brand: string | null; last_four: string | null; type: string; is_default: boolean; display_name: string }>>("/v1/payment-methods"),
  instructorRevenue: () => authedFetch<{ gross_revenue: number; net_revenue: number; total_sales: number; courses: Array<{ id: string; title: string; sales: number; price: number }> }>("/v1/instructor/revenue"),
};
