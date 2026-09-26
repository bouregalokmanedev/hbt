<?php

use App\Domains\Payments\Events\PaymentSucceeded;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\OrderItem;
use App\Domains\Payments\Models\Payment;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('enrolls the buyer when a payment succeeds', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
        'published_at' => now(),
    ]);

    $order = Order::create([
        'user_id' => $user->id,
        'currency' => 'DZD',
        'subtotal' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total' => 1000,
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
        'unit_price' => 1000,
        'total' => 1000,
    ]);

    $payment = Payment::create([
        'order_id' => $order->id,
        'user_id' => $user->id,
        'provider' => 'stripe',
        'amount' => 1000,
        'currency' => 'DZD',
        'status' => 'succeeded',
        'paid_at' => now(),
        'idempotency_key' => 'pay-'.Str::uuid(),
    ]);

    expect(Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists())->toBeFalse();

    event(new PaymentSucceeded($payment));

    expect(Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists())->toBeTrue();
});

it('does not duplicate an enrollment the learner already holds', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
        'published_at' => now(),
    ]);

    Enrollment::factory()->create(['user_id' => $user->id, 'course_id' => $course->id]);

    $order = Order::create([
        'user_id' => $user->id,
        'currency' => 'DZD',
        'subtotal' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total' => 1000,
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
        'unit_price' => 1000,
        'total' => 1000,
    ]);

    $payment = Payment::create([
        'order_id' => $order->id,
        'user_id' => $user->id,
        'provider' => 'stripe',
        'amount' => 1000,
        'currency' => 'DZD',
        'status' => 'succeeded',
        'paid_at' => now(),
        'idempotency_key' => 'pay-'.Str::uuid(),
    ]);

    event(new PaymentSucceeded($payment));

    expect(
        Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->count()
    )->toBe(1);
});
