<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Payments\Enums\PaymentMethodType;
use App\Domains\Payments\Enums\PaymentProvider;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Exceptions\UnsupportedCurrencyException;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Services\CheckoutService;
use App\Domains\Payments\Services\PaymentGatewayRegistry;
use App\Domains\Payments\Services\PaymentService;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Support\Money;
use Illuminate\Validation\ValidationException;

final readonly class CreateCheckoutAction
{
    public function __construct(
        private PaymentService $orders,
        private CheckoutService $checkout,
        private PaymentGatewayRegistry $gateways,
    ) {}

    /**
     * The checkout currency is always derived from the courses being bought.
     * Any currency supplied by the client is intentionally ignored.
     *
     * @param list<array{course_id: string, quantity?: int}> $items
     */
    public function execute(
        int $userId,
        array $items,
        ?string $provider,
        string $idempotencyKey,
        ?string $couponCode = null,
    ): array {
        $existing = Order::query()
            ->where('user_id', $userId)
            ->where('idempotency_key', $idempotencyKey)
            ->with('items')
            ->first();

        if ($existing) {
            return $this->resume($existing);
        }

        $ids = array_map(fn (array $item) => $item['course_id'], $items);
        if (count($ids) !== count(array_unique($ids))) {
            throw ValidationException::withMessages([
                'items' => ['Each course may only appear once in a checkout.'],
            ]);
        }

        $courses = Course::query()->whereIn('id', $ids)->get()->keyBy('id');
        $resolved = [];
        $currencies = [];

        foreach ($items as $item) {
            $course = $courses->get($item['course_id']);

            if (! $course) {
                throw ValidationException::withMessages([
                    'items' => ["Course {$item['course_id']} not found."],
                ]);
            }

            if ($course->status !== CourseStatus::PUBLISHED || $course->visibility !== Visibility::PUBLIC) {
                throw ValidationException::withMessages([
                    'items' => ["Course {$course->title} is not available for purchase."],
                ]);
            }

            $currency = Money::normalizeCurrency($course->currency, config('app.currency', 'DZD'));
            if (! Money::isSupported($currency)) {
                throw new UnsupportedCurrencyException("Currency {$currency} is not supported by this platform.");
            }
            $currencies[$currency] = true;

            $unitPrice = $course->is_free ? 0 : (int) ($course->discount_price ?? $course->price ?? 0);
            $resolved[] = [
                'course_id' => $course->id,
                'purchasable_type' => Course::class,
                'purchasable_id' => $course->id,
                'quantity' => $item['quantity'] ?? 1,
                'unit_price' => $unitPrice,
                'metadata' => ['course_title' => $course->title],
            ];
        }

        if (count($currencies) > 1) {
            throw ValidationException::withMessages([
                'items' => ['All courses in a checkout must use the same currency.'],
            ]);
        }

        $currency = (string) array_key_first($currencies);

        $discountAmount = 0;
        $appliedCoupon = null;
        if ($couponCode !== null && trim($couponCode) !== '') {
            $discount = \App\Domains\Marketing\Models\Discount::query()
                ->where('code', strtoupper(trim($couponCode)))
                ->first();
            if (! $discount || ! $discount->isLive() || $discount->applies_to === 'plans') {
                throw ValidationException::withMessages(['coupon_code' => ['This code is invalid or expired.']]);
            }
            $discountAmount = $discount->amountFor(array_map(
                fn ($line) => ['course_id' => $line['course_id'], 'unit_price' => $line['unit_price'], 'quantity' => $line['quantity']],
                $resolved,
            ));
            if ($discountAmount <= 0) {
                throw ValidationException::withMessages(['coupon_code' => ['This code does not apply to these courses.']]);
            }
            // Spread the reduction across eligible lines, largest first.
            $remaining = $discountAmount;
            usort($resolved, fn ($a, $b) => ($b['unit_price'] * $b['quantity']) <=> ($a['unit_price'] * $a['quantity']));
            foreach ($resolved as $index => $line) {
                if ($remaining <= 0) {
                    break;
                }
                $lineTotal = $line['unit_price'] * $line['quantity'];
                if ($lineTotal <= 0) {
                    continue;
                }
                $cut = min($lineTotal, $remaining);
                $perUnit = intdiv($cut, $line['quantity']);
                $resolved[$index]['unit_price'] = $line['unit_price'] - $perUnit;
                $remaining -= $perUnit * $line['quantity'];
            }
            $appliedCoupon = $discount;
        }

        $total = array_sum(array_map(fn ($item) => $item['unit_price'] * $item['quantity'], $resolved));

        // Free checkouts need no provider at all. Paid checkouts must resolve
        // a provider that can actually charge the derived currency.
        if ($total === 0) {
            $provider = PaymentProvider::MANUAL->value;
        } else {
            $provider ??= $this->gateways->defaultProviderFor($currency);
            $this->gateways->assertCanProcess($provider, $currency);
        }

        $order = $this->orders->createOrder(
            $resolved,
            $provider,
            $currency,
            $idempotencyKey,
            $userId,
        );

        if ($order->wasRecentlyCreated) {
            if ($discountAmount > 0) {
                $order->update(['discount_amount' => $discountAmount]);
            }
            $appliedCoupon?->increment('used_count');
        }

        return $this->resume($order);
    }

    private function resume(Order $order): array
    {
        $order = $order->fresh(['items']);
        $free = (int) $order->total === 0;

        // A retried checkout must never mint a second payment or re-run
        // fulfillment — return the already-settled order as-is.
        if ($order->status === 'paid') {
            return [
                'order' => $order,
                'payment' => $order->payments()->latest()->first(),
                'free' => $free,
            ];
        }

        if ($free) {
            $payment = Payment::query()->createOrFirst(
                ['idempotency_key' => 'free:'.$order->id],
                [
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'provider' => $order->provider,
                    'payment_method_type' => PaymentMethodType::FREE->value,
                    'amount' => 0,
                    'currency' => $order->currency,
                    'status' => PaymentStatus::PENDING->value,
                    'metadata' => ['order_id' => $order->id, 'free_checkout' => true],
                ],
            );

            if ($payment->status !== PaymentStatus::SUCCEEDED) {
                $this->orders->markSucceeded($payment, ['free_checkout' => true]);
            }

            return [
                'order' => $order->fresh(),
                'payment' => $payment->fresh(),
                'free' => true,
            ];
        }

        $payment = $this->checkout->createCheckout($order, $order->provider);

        return ['order' => $order, 'payment' => $payment, 'free' => false];
    }
}
