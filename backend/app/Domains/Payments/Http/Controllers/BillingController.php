<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Models\Invoice;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Subscription;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BillingController extends Controller
{
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['items.purchasable', 'payments'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Order $order) => $this->serializeOrder($order));

        return response()->json([
            'success' => true,
            'message' => 'Orders retrieved.',
            'data' => $orders,
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $invoices = Invoice::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Invoice $invoice) => $this->serializeInvoice($invoice));

        return response()->json([
            'success' => true,
            'message' => 'Invoices retrieved.',
            'data' => $invoices,
        ]);
    }

    public function invoiceDownload(Request $request, Invoice $invoice): Response
    {
        abort_unless($invoice->user_id === $request->user()->id, 404);

        $order = $invoice->order_id
            ? Order::with(['items.purchasable'])->find($invoice->order_id)
            : null;

        $lineItems = $this->lineItems($invoice, $order);
        $customer = $request->user();
        $customerName = trim(($customer->first_name ?? '').' '.($customer->last_name ?? ''));
        $logoPath = base_path('../frontend/public/hbt-logo-full.png');
        $logoData = is_file($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : null;

        return Pdf::loadView('invoices.invoice', [
            'invoice' => $invoice,
            'customerName' => $customerName !== '' ? $customerName : $customer->email,
            'customerEmail' => $customer->email,
            'numberLabel' => $invoice->number ?? 'INV-'.substr($invoice->id, 0, 8),
            'lineItems' => $lineItems,
            'logoData' => $logoData,
            'issuedDate' => $invoice->issued_at?->format('F j, Y') ?? '',
            'periodLabel' => $this->periodLabel($invoice),
        ])->setPaper('a4', 'portrait')->download(
            'HBT-invoice-'.($invoice->number ?? $invoice->id).'.pdf'
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function lineItems(Invoice $invoice, ?Order $order): array
    {
        if ($order !== null) {
            return $order->items->map(fn ($item) => [
                'label' => $item->metadata['title']
                    ?? $item->purchasable?->title
                    ?? class_basename($item->purchasable_type),
                'qty' => $item->quantity,
                'total' => $item->total,
            ])->all();
        }

        if ($invoice->subscription_id !== null) {
            $subscription = Subscription::with('plan:id,name')->find($invoice->subscription_id);
            $label = trim(($subscription->plan->name ?? 'Subscription').' '.$this->periodLabel($invoice));

            return [['label' => $label, 'qty' => 1, 'total' => $invoice->total]];
        }

        return [['label' => 'Order '.$invoice->number, 'qty' => 1, 'total' => $invoice->total]];
    }

    private function periodLabel(Invoice $invoice): string
    {
        if ($invoice->period_start === null) {
            return '';
        }

        $start = $invoice->period_start->format('M j, Y');
        $end = $invoice->period_end?->format('M j, Y');

        return $end !== null ? $start.' – '.$end : $start;
    }

    private function serializeOrder(Order $order): array
    {
        $latestPayment = $order->payments->sortByDesc('created_at')->first();

        return [
            'id' => $order->id,
            'status' => $order->status,
            'currency' => $order->currency,
            'subtotal' => $order->subtotal,
            'discount_amount' => $order->discount_amount,
            'tax_amount' => $order->tax_amount,
            'total' => $order->total,
            'provider' => $order->provider,
            'payment_type' => $order->payment_type,
            'placed_at' => $order->placed_at?->toISOString(),
            'paid_at' => $order->paid_at?->toISOString(),
            'cancelled_at' => $order->cancelled_at?->toISOString(),
            'items' => $order->items->map(fn ($item) => [
                'title' => $item->metadata['title']
                    ?? $item->purchasable?->title
                    ?? class_basename($item->purchasable_type),
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'total' => $item->total,
            ]),
            'payment' => $latestPayment === null ? null : [
                'id' => $latestPayment->id,
                'status' => $latestPayment->status->value,
                'provider' => $latestPayment->provider->value,
                'method' => $latestPayment->payment_method_type->value,
                'amount' => $latestPayment->amount,
                'paid_at' => $latestPayment->paid_at?->toISOString(),
                'failure_message' => $latestPayment->failure_message,
            ],
        ];
    }

    private function serializeInvoice(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'number' => $invoice->number,
            'status' => $invoice->status->value,
            'currency' => $invoice->currency,
            'subtotal' => $invoice->subtotal,
            'discount_amount' => $invoice->discount_amount,
            'tax_amount' => $invoice->tax_amount,
            'total' => $invoice->total,
            'provider' => $invoice->provider,
            'order_id' => $invoice->order_id,
            'subscription_id' => $invoice->subscription_id,
            'issued_at' => $invoice->issued_at?->toISOString(),
            'due_at' => $invoice->due_at?->toISOString(),
            'paid_at' => $invoice->paid_at?->toISOString(),
            'period_start' => $invoice->period_start?->toISOString(),
            'period_end' => $invoice->period_end?->toISOString(),
        ];
    }
}
