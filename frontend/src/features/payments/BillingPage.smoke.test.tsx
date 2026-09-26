import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import { BillingPage } from "./BillingPage";
import type {
  BillingInvoice,
  BillingOrder,
  BillingPaymentMethod,
  BillingSubscription,
} from "./billing";

vi.mock("./billing", () => ({
  billingApi: {
    orders: vi.fn(),
    invoices: vi.fn(),
    subscriptions: vi.fn(),
    paymentMethods: vi.fn(),
    addPaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
  },
  downloadInvoice: vi.fn(),
}));

import { billingApi, downloadInvoice } from "./billing";

function buildOrder(overrides: Partial<BillingOrder> = {}): BillingOrder {
  return {
    id: "ord-1",
    status: "paid",
    currency: "DZD",
    subtotal: 1500,
    discount_amount: 0,
    tax_amount: 0,
    total: 1500,
    provider: "stripe",
    payment_type: "one_time",
    placed_at: "2026-09-01T10:00:00Z",
    paid_at: "2026-09-01T10:01:00Z",
    cancelled_at: null,
    items: [
      { title: "CAN Bus diagnostics", quantity: 1, unit_price: 1500, total: 1500 },
    ],
    payment: {
      id: "pay-1",
      status: "succeeded",
      provider: "stripe",
      method: "card",
      amount: 1500,
      paid_at: "2026-09-01T10:01:00Z",
      failure_message: null,
    },
    ...overrides,
  };
}

function buildInvoice(overrides: Partial<BillingInvoice> = {}): BillingInvoice {
  return {
    id: "inv-1",
    number: "INV-2026-0001",
    status: "paid",
    currency: "DZD",
    subtotal: 1500,
    discount_amount: 0,
    tax_amount: 0,
    total: 1500,
    provider: "stripe",
    order_id: "ord-1",
    subscription_id: null,
    issued_at: "2026-09-01T10:01:00Z",
    due_at: null,
    paid_at: "2026-09-01T10:01:00Z",
    period_start: null,
    period_end: null,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/billing"]}>
        <BillingPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function mockBilling(payload: {
  orders?: BillingOrder[];
  invoices?: BillingInvoice[];
  subscriptions?: BillingSubscription[];
  methods?: BillingPaymentMethod[];
} = {}) {
  vi.mocked(billingApi.orders).mockResolvedValue(payload.orders ?? []);
  vi.mocked(billingApi.invoices).mockResolvedValue(payload.invoices ?? []);
  vi.mocked(billingApi.subscriptions).mockResolvedValue(payload.subscriptions ?? []);
  vi.mocked(billingApi.paymentMethods).mockResolvedValue(payload.methods ?? []);
}


function buildMethod(
  overrides: Partial<BillingPaymentMethod> = {},
): BillingPaymentMethod {
  return {
    id: "pm-1",
    provider: "stripe",
    brand: "visa",
    last_four: "4242",
    type: "card",
    is_default: true,
    display_name: "Visa ····4242",
    ...overrides,
  };
}

describe("BillingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(downloadInvoice).mockResolvedValue(undefined);
    vi.mocked(billingApi.setDefaultPaymentMethod).mockResolvedValue({
      id: "pm-2",
      brand: "mastercard",
      last_four: "5555",
      type: "card",
      is_default: true,
      display_name: "Mastercard ····5555",
    });
    vi.mocked(billingApi.removePaymentMethod).mockResolvedValue(undefined);
  });

  it("renders orders, invoices and subscription sections", async () => {
    mockBilling({
      orders: [buildOrder()],
      invoices: [buildInvoice()],
      subscriptions: [
        {
          id: "sub-1",
          plan: "HBT Pro",
          status: "active",
          current_period_ends_at: "2026-10-01T00:00:00Z",
          cancelled_at: null,
          created_at: "2026-09-01T00:00:00Z",
        },
      ],
      methods: [
        {
          id: "pm-1",
          brand: "visa",
          last_four: "4242",
          type: "card",
          is_default: true,
          display_name: "Visa ····4242",
        },
      ],
    });

    renderPage();

    expect(await screen.findByTestId("billing-page")).toBeInTheDocument();
    expect(screen.getByTestId("billing-order-ord-1")).toHaveTextContent(
      "CAN Bus diagnostics",
    );
    expect(screen.getByTestId("billing-order-ord-1")).toHaveTextContent("DZD");
    expect(screen.getByTestId("billing-invoice-inv-1")).toHaveTextContent(
      "INV-2026-0001",
    );
    expect(screen.getByTestId("billing-subscription")).toHaveTextContent("HBT Pro");
    expect(screen.getByTestId("billing-method-pm-1")).toHaveTextContent("···· 4242");
    expect(billingApi.orders).toHaveBeenCalledTimes(1);
    expect(billingApi.invoices).toHaveBeenCalledTimes(1);
  });

  it("shows empty states when the learner has no billing history", async () => {
    mockBilling();

    renderPage();

    expect(await screen.findByTestId("billing-page")).toBeInTheDocument();
    expect(screen.getAllByTestId("billing-empty").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByTestId("billing-subscription")).toHaveTextContent(
      "don't have a subscription yet",
    );
  });

  it("offers checkout for pending orders and hides it for paid ones", async () => {
    mockBilling({ orders: [buildOrder({ status: "pending", paid_at: null })] });

    renderPage();

    const order = await screen.findByTestId("billing-order-ord-1");
    expect(order).toHaveTextContent("Pending");
    expect(screen.getByTestId("billing-order-pay-ord-1")).toHaveAttribute(
      "href",
      "/checkout/ord-1",
    );
  });

  it("downloads an invoice as a pdf", async () => {
    mockBilling({ invoices: [buildInvoice()] });

    renderPage();

    const invoice = buildInvoice();
    fireEvent.click(await screen.findByTestId("invoice-download-inv-1"));

    await waitFor(() => expect(downloadInvoice).toHaveBeenCalledWith(invoice));
  });

  it("adds a payment method from the form", async () => {
    mockBilling();
    vi.mocked(billingApi.addPaymentMethod).mockResolvedValue({
      id: "pm-2",
      brand: "visa",
      last_four: "4242",
      type: "card",
      is_default: true,
      display_name: "Visa ····4242",
    });

    renderPage();

    await screen.findByTestId("billing-page");
    fireEvent.change(screen.getByTestId("method-last4"), { target: { value: "4242" } });
    fireEvent.click(screen.getByTestId("method-add-submit"));

    await waitFor(() =>
      expect(billingApi.addPaymentMethod).toHaveBeenCalledWith(
        expect.objectContaining({ brand: "visa", last_four: "4242", type: "card" }),
      ),
    );
    expect(await screen.findByTestId("billing-method-pm-2")).toBeInTheDocument();
  });

  it("adds Tamara as a BNPL method without card fields", async () => {
    mockBilling();
    vi.mocked(billingApi.addPaymentMethod).mockResolvedValue({
      id: "pm-3",
      brand: "tamara",
      last_four: null,
      type: "tamara",
      is_default: true,
      display_name: "Tamara",
    });

    renderPage();
    await screen.findByTestId("billing-page");

    fireEvent.change(screen.getByTestId("method-brand"), { target: { value: "tamara" } });
    expect(screen.queryByTestId("method-last4")).toBeNull();
    expect(screen.queryByTestId("method-exp-month")).toBeNull();
    expect(screen.getByTestId("method-add-submit")).toBeEnabled();

    fireEvent.click(screen.getByTestId("method-add-submit"));

    await waitFor(() =>
      expect(billingApi.addPaymentMethod).toHaveBeenCalledWith({
        provider: "tamara",
        type: "tamara",
        brand: "tamara",
      }),
    );
    expect(await screen.findByTestId("billing-method-pm-3")).toBeInTheDocument();
    expect(screen.getByTestId("billing-method-pm-3").querySelector('[data-brand="tamara"]')).toBeTruthy();
  });


  it("renders the brand logo for each saved card", async () => {
    mockBilling({
      methods: [
        buildMethod(),
        buildMethod({ id: "pm-2", brand: "mastercard", last_four: "5555", is_default: false }),
        buildMethod({ id: "pm-3", brand: "amex", last_four: "1005", is_default: false }),
      ],
    });

    renderPage();

    await screen.findByTestId("billing-page");
    expect(screen.getByTestId("billing-method-pm-1").querySelector('[data-brand="visa"]')).toBeTruthy();
    expect(screen.getByTestId("billing-method-pm-2").querySelector('[data-brand="mastercard"]')).toBeTruthy();
    expect(screen.getByTestId("billing-method-pm-3").querySelector('[data-brand="amex"]')).toBeTruthy();
  });

  it("lets the learner choose which card is the default", async () => {
    mockBilling({
      methods: [
        buildMethod(),
        buildMethod({ id: "pm-2", brand: "mastercard", last_four: "5555", is_default: false }),
      ],
    });

    renderPage();

    fireEvent.click(await screen.findByTestId("method-set-default-pm-2"));

    await waitFor(() =>
      expect(billingApi.setDefaultPaymentMethod).toHaveBeenCalledWith("pm-2"),
    );
    expect(await screen.findByTestId("method-default-chip-pm-2")).toBeInTheDocument();
    expect(screen.queryByTestId("method-set-default-pm-2")).toBeNull();
    expect(screen.queryByTestId("method-default-chip-pm-1")).toBeNull();
  });

  it("removes a saved card from the list", async () => {
    mockBilling({
      methods: [buildMethod(), buildMethod({ id: "pm-2", brand: "visa", last_four: "9999", is_default: false })],
    });

    renderPage();

    fireEvent.click(await screen.findByTestId("method-remove-pm-2"));

    await waitFor(() =>
      expect(billingApi.removePaymentMethod).toHaveBeenCalledWith("pm-2"),
    );
    await waitFor(() => expect(screen.queryByTestId("billing-method-pm-2")).toBeNull());
    expect(screen.getByTestId("billing-method-pm-1")).toBeInTheDocument();
  });

  it("surfaces API failures", async () => {
    vi.mocked(billingApi.orders).mockRejectedValue(new Error("Boom"));
    vi.mocked(billingApi.invoices).mockResolvedValue([]);
    vi.mocked(billingApi.subscriptions).mockResolvedValue([]);
    vi.mocked(billingApi.paymentMethods).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByTestId("billing-error")).toHaveTextContent("Boom");
  });
});
