<?php

namespace App\Console\Commands;

use App\Domains\Marketing\Models\Discount;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Payments\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class RecoverAbandonedCarts extends Command
{
    protected $signature = 'marketing:recover-carts
        {--hours=24 : Only orders pending longer than this many hours}
        {--code= : Existing discount code to offer (auto-creates a 10% 72h code when omitted)}
        {--dry-run : List who would be nudged without sending anything}';

    protected $description = 'Nudge learners with stale pending orders back to checkout with a time-limited code.';

    public function handle(StudentNotificationService $notifications): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $dryRun = (bool) $this->option('dry-run');

        $discount = $this->resolveDiscount((string) ($this->option('code') ?? ''));

        if (! $discount) {
            $this->error('No live discount available and none could be created.');
            return self::FAILURE;
        }

        $orders = Order::query()
            ->where('status', 'pending')
            ->where('created_at', '<', now()->subHours($hours))
            ->whereHas('user', fn ($query) => $query->where('status', 'active'))
            ->with('user')
            ->latest()
            ->take(500)
            ->get();

        $sent = 0;

        foreach ($orders as $order) {
            $user = $order->user;

            if (! $user) {
                continue;
            }

            if ($dryRun) {
                $this->line("Would nudge {$user->email} about order {$order->id} with {$discount->code}.");
                $sent++;
                continue;
            }

            $delivered = $notifications->send(
                $user,
                'cart_recovery',
                'Your course is still waiting (+10% off)',
                "You left checkout before finishing. Complete order {$order->id} in the next 72 hours with code {$discount->code} for {$discount->value}% off.",
                "/checkout/{$order->id}?coupon={$discount->code}",
                'cart-recovery:'.$order->id,
            );

            if ($delivered) {
                $sent++;
            }
        }

        $this->info(($dryRun ? 'Would nudge ' : 'Nudged ').$sent.' learner(s) with code '.$discount->code.'.');

        return self::SUCCESS;
    }

    private function resolveDiscount(string $code): ?Discount
    {
        $code = strtoupper(trim($code));

        if ($code !== '') {
            $discount = Discount::query()->where('code', $code)->first();

            return $discount && $discount->isLive() ? $discount : null;
        }

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $generated = 'COMEBACK-'.Str::upper(Str::random(4));

            if (Discount::query()->where('code', $generated)->exists()) {
                continue;
            }

            return Discount::query()->create([
                'name' => 'Cart recovery '.now()->toDateString(),
                'code' => $generated,
                'description' => 'Auto-created abandoned-cart incentive: 10% for 72 hours.',
                'type' => 'percent',
                'value' => 10,
                'applies_to' => 'all',
                'starts_at' => now(),
                'ends_at' => now()->addHours(72),
                'active' => true,
            ]);
        }

        return null;
    }
}
