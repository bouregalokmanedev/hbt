<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Payments\Enums\PaymentProvider;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Services\CheckoutService;
use App\Domains\Payments\Services\PaymentService;
use App\Models\Course;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final readonly class CreateCheckoutAction
{
    public function __construct(
        private PaymentService $orders,
        private CheckoutService $checkout,
    ) {}

    /**
     * @param list<array{course_id: string, quantity?: int}> $items
     */
    public function execute(int $userId, array $items, string $provider, string $currency, string $idempotencyKey, ?string $couponCode = null): array
    {
        $resolved = [];
        foreach ($items as $item) {
            $course = Course::query()->find($item['course_id']);
            if (! $course) {
                throw ValidationException::withMessages(['items' => ["Course {$item['course_id']} not found."]]);
            }
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
        if ($total === 0) {
            $existing = $resolved[0] ?? null;
            if ($existing) {
                $order = $this->orders->createOrder($resolved, $provider, $currency, $idempotencyKey, $userId);
                $order->update(['status' => 'paid', 'paid_at' => now(), 'discount_amount' => $discountAmount]);
                if ($order->wasRecentlyCreated) {
                    $appliedCoupon?->increment('used_count');
                }
                return ['order' => $order->fresh(), 'payment' => null, 'free' => true];
            }
        }

        $order = $this->orders->createOrder($resolved, $provider, $currency, $idempotencyKey, $userId);
        if ($discountAmount > 0) {
            $order->update(['discount_amount' => $discountAmount]);
        }
        if ($order->wasRecentlyCreated) {
            $appliedCoupon?->increment('used_count');
        }
        $payment = $this->checkout->createCheckout($order, $provider);

        return ['order' => $order, 'payment' => $payment, 'free' => false];
    }
}
