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
    public function execute(int $userId, array $items, string $provider, string $currency, string $idempotencyKey): array
    {
        $resolved = [];
        foreach ($items as $item) {
            $course = Course::query()->find($item['course_id']);
            if (! $course) {
                throw ValidationException::withMessages(['items' => ["Course {$item['course_id']} not found."]]);
            }
            $unitPrice = $course->is_free ? 0 : (int) ($course->discount_price ?? $course->price ?? 0);
            $resolved[] = [
                'purchasable_type' => Course::class,
                'purchasable_id' => $course->id,
                'quantity' => $item['quantity'] ?? 1,
                'unit_price' => $unitPrice,
                'metadata' => ['course_title' => $course->title],
            ];
        }

        $total = array_sum(array_map(fn ($item) => $item['unit_price'] * $item['quantity'], $resolved));
        if ($total === 0) {
            $existing = $resolved[0] ?? null;
            if ($existing) {
                $order = $this->orders->createOrder($resolved, $provider, $currency, $idempotencyKey, $userId);
                $order->update(['status' => 'paid', 'paid_at' => now()]);
                return ['order' => $order->fresh(), 'payment' => null, 'free' => true];
            }
        }

        $order = $this->orders->createOrder($resolved, $provider, $currency, $idempotencyKey, $userId);
        $payment = $this->checkout->createCheckout($order, $provider);

        return ['order' => $order, 'payment' => $payment, 'free' => false];
    }
}
