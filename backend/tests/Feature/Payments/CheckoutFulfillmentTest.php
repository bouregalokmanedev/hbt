<?php

use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Services\PaymentService;
use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('completes a free checkout and enrolls the learner immediately', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => \App\Enums\Courses\Visibility::PUBLIC,
        'is_free' => true,
        'price' => 0,
    ]);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/checkout', [
        'items' => [['course_id' => $course->id]],
        'provider' => 'manual',
        'currency' => 'USD',
        'idempotency_key' => 'free-checkout-1',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.free', true)
        ->assertJsonPath('data.status', 'paid');

    $order = Order::query()->where('idempotency_key', 'free-checkout-1')->sole();

    expect($order->status)->toBe('paid')
        ->and((int) $order->total)->toBe(0)
        ->and(Payment::query()->where('order_id', $order->id)->where('status', PaymentStatus::SUCCEEDED->value)->exists())->toBeTrue();

    $enrollment = Enrollment::query()
        ->where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->sole();

    expect($enrollment->status)->toBe(EnrollmentStatus::ACTIVE);
});

it('re-enrolls a learner whose previous enrollment was cancelled when they purchase again', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => \App\Enums\Courses\Visibility::PUBLIC,
        'is_free' => false,
        'price' => 2500,
    ]);

    $enrollment = Enrollment::factory()->cancelled()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $order = Order::create([
        'user_id' => $user->id,
        'currency' => 'USD',
        'subtotal' => 2500,
        'total' => 2500,
        'status' => 'pending',
        'provider' => 'manual',
        'idempotency_key' => 'repurchase-1',
        'placed_at' => now(),
    ]);

    $order->items()->create([
        'purchasable_type' => Course::class,
        'purchasable_id' => $course->id,
        'quantity' => 1,
        'unit_price' => 2500,
        'total' => 2500,
    ]);

    $payment = Payment::create([
        'order_id' => $order->id,
        'user_id' => $user->id,
        'provider' => 'manual',
        'payment_method_type' => 'card',
        'amount' => 2500,
        'currency' => 'USD',
        'status' => PaymentStatus::PENDING->value,
        'idempotency_key' => 'repurchase-payment-1',
    ]);

    app(PaymentService::class)->markSucceeded($payment);

    $enrollment->refresh();

    expect($enrollment->status)->toBe(EnrollmentStatus::ACTIVE)
        ->and($enrollment->cancelled_at)->toBeNull()
        ->and(Enrollment::query()->count())->toBe(1);
});

it('rejects self-enrollment into a paid course without a purchase', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => \App\Enums\Courses\Visibility::PUBLIC,
        'is_free' => false,
        'price' => 4000,
        'discount_price' => null,
    ]);

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/enrollments', [
        'course_id' => $course->id,
    ])
        ->assertStatus(402)
        ->assertJsonPath('code', 'purchase_required');

    expect(
        Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists()
    )->toBeFalse();
});
