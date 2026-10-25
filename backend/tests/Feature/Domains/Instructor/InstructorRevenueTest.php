<?php

use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\PaymentTransaction;
use App\Domains\Payments\Models\Payout;
use App\Domains\Payments\Services\InstructorPayoutAutomationService;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
    config(['payments.instructor_share' => 0.7]);
});

function revenueInstructor(): User
{
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    return $instructor;
}

/**
 * @return array{0: Order, 1: Payment}
 */
function revenueOrder(User $buyer, array $lines): array
{
    $subtotal = array_sum(array_map(fn ($line) => $line['total'], $lines));

    $order = Order::create([
        'user_id' => $buyer->id,
        'currency' => 'USD',
        'subtotal' => $subtotal,
        'total' => $subtotal,
        'status' => 'paid',
        'provider' => 'manual',
        'idempotency_key' => 'revenue-'.uniqid(),
        'placed_at' => now(),
        'paid_at' => now(),
    ]);

    foreach ($lines as $line) {
        $order->items()->create([
            'purchasable_type' => Course::class,
            'purchasable_id' => $line['course_id'],
            'quantity' => 1,
            'unit_price' => $line['total'],
            'total' => $line['total'],
        ]);
    }

    $payment = Payment::create([
        'order_id' => $order->id,
        'user_id' => $buyer->id,
        'provider' => 'manual',
        'payment_method_type' => 'card',
        'amount' => $subtotal,
        'currency' => 'USD',
        'status' => PaymentStatus::SUCCEEDED->value,
        'paid_at' => now(),
        'idempotency_key' => 'revenue-payment-'.uniqid(),
    ]);

    return [$order, $payment];
}

it('attributes order revenue only to the owning instructor', function () {
    $a = revenueInstructor();
    $b = revenueInstructor();
    $buyer = User::factory()->create();

    $courseA = Course::factory()->create(['instructor_id' => $a->id, 'price' => 3000, 'is_free' => false]);
    $courseB = Course::factory()->create(['instructor_id' => $b->id, 'price' => 2000, 'is_free' => false]);

    revenueOrder($buyer, [
        ['course_id' => $courseA->id, 'total' => 3000],
        ['course_id' => $courseB->id, 'total' => 2000],
    ]);

    $this->actingAs($a)
        ->getJson('/api/v1/instructor/revenue')
        ->assertOk()
        ->assertJsonPath('data.gross_revenue', 3000)
        ->assertJsonPath('data.refunded', 0)
        ->assertJsonPath('data.net_revenue', 2100)
        ->assertJsonPath('data.total_sales', 1)
        ->assertJsonPath('data.courses.0.gross_revenue', 3000);

    $this->actingAs($b)
        ->getJson('/api/v1/instructor/revenue')
        ->assertOk()
        ->assertJsonPath('data.gross_revenue', 2000)
        ->assertJsonPath('data.net_revenue', 1400);
});

it('allocates refunds proportionally across instructors in a shared order', function () {
    $a = revenueInstructor();
    $b = revenueInstructor();
    $buyer = User::factory()->create();

    $courseA = Course::factory()->create(['instructor_id' => $a->id, 'price' => 3000, 'is_free' => false]);
    $courseB = Course::factory()->create(['instructor_id' => $b->id, 'price' => 2000, 'is_free' => false]);

    [, $payment] = revenueOrder($buyer, [
        ['course_id' => $courseA->id, 'total' => 3000],
        ['course_id' => $courseB->id, 'total' => 2000],
    ]);

    PaymentTransaction::create([
        'payment_id' => $payment->id,
        'type' => 'partial_refund',
        'amount' => 500,
        'currency' => 'USD',
        'status' => 'succeeded',
        'metadata' => ['reason' => 'test'],
    ]);

    $this->actingAs($a)
        ->getJson('/api/v1/instructor/revenue')
        ->assertOk()
        ->assertJsonPath('data.refunded', 300)
        ->assertJsonPath('data.refunds', 1)
        ->assertJsonPath('data.net_revenue', 1890);

    $this->actingAs($b)
        ->getJson('/api/v1/instructor/revenue')
        ->assertOk()
        ->assertJsonPath('data.refunded', 200)
        ->assertJsonPath('data.net_revenue', 1260);
});

it('generates one idempotent payout per instructor from their own revenue', function () {
    $a = revenueInstructor();
    $b = revenueInstructor();
    $buyer = User::factory()->create();

    $courseA = Course::factory()->create(['instructor_id' => $a->id, 'price' => 3000, 'is_free' => false]);
    $courseB = Course::factory()->create(['instructor_id' => $b->id, 'price' => 2000, 'is_free' => false]);

    [, $payment] = revenueOrder($buyer, [
        ['course_id' => $courseA->id, 'total' => 3000],
        ['course_id' => $courseB->id, 'total' => 2000],
    ]);

    PaymentTransaction::create([
        'payment_id' => $payment->id,
        'type' => 'refund',
        'amount' => 500,
        'currency' => 'USD',
        'status' => 'succeeded',
    ]);

    $service = app(InstructorPayoutAutomationService::class);
    $period = now()->format('Y-m');

    $created = $service->generateForPeriod($period);

    expect($created)->toHaveCount(2)
        ->and(Payout::query()->where('instructor_id', $a->id)->sole()->amount)->toBe(1890)
        ->and(Payout::query()->where('instructor_id', $b->id)->sole()->amount)->toBe(1260);

    expect($service->generateForPeriod($period))->toBe([]);
    expect(Payout::query()->count())->toBe(2);
});
