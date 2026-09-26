<?php

use App\Domains\Payments\Models\Invoice;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\OrderItem;
use App\Domains\Payments\Models\Payment;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function billingOrderFor(User $user, Course $course, int $total = 1500): Order
{
    $order = Order::create([
        'user_id' => $user->id,
        'currency' => 'DZD',
        'subtotal' => $total,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total' => $total,
        'status' => 'paid',
        'payment_type' => 'one_time',
        'provider' => 'stripe',
        'idempotency_key' => 'ord-'.Str::uuid(),
        'placed_at' => now(),
        'paid_at' => now(),
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'purchasable_type' => Course::class,
        'purchasable_id' => $course->id,
        'quantity' => 1,
        'unit_price' => $total,
        'total' => $total,
        'metadata' => ['title' => $course->title],
    ]);

    Payment::create([
        'order_id' => $order->id,
        'user_id' => $user->id,
        'provider' => 'stripe',
        'payment_method_type' => 'card',
        'amount' => $total,
        'currency' => 'DZD',
        'status' => 'succeeded',
        'paid_at' => now(),
        'idempotency_key' => 'pay-'.Str::uuid(),
    ]);

    return $order;
}

it('requires authentication for billing endpoints', function (string $uri) {
    $this->getJson($uri)->assertStatus(401);
})->with([
    '/api/v1/billing/orders',
    '/api/v1/billing/invoices',
]);

it('lists only the authenticated user orders', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
        'published_at' => now(),
    ]);

    $mine = billingOrderFor($me, $course);
    $theirs = billingOrderFor($other, $course, 900);

    $this->actingAs($me)
        ->getJson('/api/v1/billing/orders')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $mine->id);

    expect(collect($this->getJson('/api/v1/billing/orders')->json('data'))->pluck('id'))
        ->not->toContain($theirs->id);
});

it('exposes order totals items and payment details', function () {
    $me = User::factory()->create();
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
        'published_at' => now(),
    ]);
    billingOrderFor($me, $course, 1500);

    $this->actingAs($me)
        ->getJson('/api/v1/billing/orders')
        ->assertOk()
        ->assertJsonPath('data.0.total', 1500)
        ->assertJsonPath('data.0.currency', 'DZD')
        ->assertJsonPath('data.0.status', 'paid')
        ->assertJsonPath('data.0.items.0.quantity', 1)
        ->assertJsonPath('data.0.items.0.total', 1500)
        ->assertJsonPath('data.0.payment.status', 'succeeded')
        ->assertJsonPath('data.0.payment.method', 'card');

    expect($this->getJson('/api/v1/billing/orders')->json('data.0.items.0.title'))
        ->toBe($course->title);
});

it('lists only the authenticated user invoices', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();

    $mine = Invoice::create([
        'user_id' => $me->id,
        'number' => 'INV-TEST-001',
        'currency' => 'DZD',
        'subtotal' => 1500,
        'total' => 1500,
        'status' => 'paid',
        'issued_at' => now(),
        'paid_at' => now(),
    ]);
    Invoice::create([
        'user_id' => $other->id,
        'number' => 'INV-TEST-002',
        'currency' => 'DZD',
        'subtotal' => 900,
        'total' => 900,
        'status' => 'paid',
        'issued_at' => now(),
        'paid_at' => now(),
    ]);

    $response = $this->actingAs($me)->getJson('/api/v1/billing/invoices')->assertOk();

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.id'))->toBe($mine->id)
        ->and($response->json('data.0.status'))->toBe('paid');
});

it('downloads its own invoice as a pdf', function () {
    $me = User::factory()->create();
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
        'published_at' => now(),
    ]);
    $order = billingOrderFor($me, $course);

    $invoice = Invoice::create([
        'user_id' => $me->id,
        'order_id' => $order->id,
        'number' => 'INV-TEST-PDF',
        'currency' => 'DZD',
        'subtotal' => 1500,
        'total' => 1500,
        'status' => 'paid',
        'issued_at' => now(),
        'paid_at' => now(),
    ]);

    $response = $this->actingAs($me)->get('/api/v1/billing/invoices/'.$invoice->id.'/download');

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('pdf')
        ->and(substr((string) $response->getContent(), 0, 4))->toBe('%PDF');
});

it('hides invoices from other users with a 404', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();

    $invoice = Invoice::create([
        'user_id' => $owner->id,
        'number' => 'INV-TEST-HIDDEN',
        'currency' => 'DZD',
        'subtotal' => 500,
        'total' => 500,
        'status' => 'paid',
        'issued_at' => now(),
        'paid_at' => now(),
    ]);

    $this->actingAs($intruder)
        ->get('/api/v1/billing/invoices/'.$invoice->id.'/download')
        ->assertNotFound();

    $this->actingAs($intruder)
        ->getJson('/api/v1/billing/invoices')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});
