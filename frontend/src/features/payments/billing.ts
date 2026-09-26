import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

import { authedFetch } from "./api";

export interface BillingOrderItem {
  title: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface BillingOrder {
  id: string;
  status: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  provider: string;
  payment_type: string;
  placed_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  items: BillingOrderItem[];
  payment: {
    id: string;
    status: string;
    provider: string;
    method: string;
    amount: number;
    paid_at: string | null;
    failure_message: string | null;
  } | null;
}

export interface BillingInvoice {
  id: string;
  number: string | null;
  status: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  provider: string;
  order_id: string | null;
  subscription_id: string | null;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
}

export interface BillingSubscription {
  id: string;
  plan: string | null;
  status: string;
  current_period_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
}

export interface BillingPaymentMethod {
  id: string;
  provider?: string;
  brand: string | null;
  last_four: string | null;
  type: string;
  exp_month?: number | null;
  exp_year?: number | null;
  is_default: boolean;
  display_name: string;
}

export interface PaymentMethodPayload {
  provider?: string;
  type?: string;
  brand?: string;
  last_four?: string;
  exp_month?: number;
  exp_year?: number;
}

export const billingApi = {
  orders: () => authedFetch<BillingOrder[]>("/v1/billing/orders"),
  invoices: () => authedFetch<BillingInvoice[]>("/v1/billing/invoices"),
  subscriptions: () => authedFetch<BillingSubscription[]>("/v1/subscriptions"),
  paymentMethods: () => authedFetch<BillingPaymentMethod[]>("/v1/payment-methods"),
  addPaymentMethod: (payload: PaymentMethodPayload) =>
    authedFetch<BillingPaymentMethod>("/v1/payment-methods", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  setDefaultPaymentMethod: (id: string) =>
    authedFetch<BillingPaymentMethod>(`/v1/payment-methods/${id}/default`, {
      method: "PATCH",
    }),
  removePaymentMethod: (id: string) =>
    authedFetch<unknown>(`/v1/payment-methods/${id}`, { method: "DELETE" }),
};

export async function downloadInvoice(invoice: BillingInvoice): Promise<void> {
  const token = authStorage.getToken();
  const res = await fetch(
    `${env.apiUrl}/v1/billing/invoices/${invoice.id}/download`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: "application/pdf",
      },
    },
  );

  if (!res.ok) throw new Error("Invoice download failed.");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `HBT-invoice-${invoice.number ?? invoice.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
