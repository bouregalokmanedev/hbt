<?php

use App\Domains\Payments\Actions\HandleWebhookAction;
use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Events\PaymentSucceeded;
use App\Domains\Payments\Exceptions\PaymentGatewayConfigurationException;
use App\Domains\Payments\Exceptions\PaymentProviderUnavailableException;
use App\Domains\Payments\Gateways\PayPal\PayPalPaymentGateway;
use App\Domains\Payments\Gateways\Stripe\StripePaymentGateway;
use App\Domains\Payments\Models\Invoice;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\PaymentTransaction;
use App\Domains\Payments\Models\Plan;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Models\WebhookEvent;
use App\Domains\Payments\Services\PaymentService;
use App\Domains\Payments\Services\SubscriptionService;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

afterEach(function () {
    \Stripe\ApiRequestor::setHttpClient(null);
});

function hardeningCourse(array $attributes = []): Course
{
    return Course::factory()->create(array_merge([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
        'is_free' => false,
        'price' => 2500,
        'discount_price' => null,
        'currency' => 'DZD',
    ], $attributes));
}

it('derives the checkout currency from the course and ignores the client currency', function () {
    $user = User::factory()->create();
    $course = hardeningCourse(['currency' => 'DZD']);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/checkout', [
        'items' => [['course_id' => $course->id]],
        'provider' => 'manual',
        'currency' => 'USD',
        'idempotency_key' => 'derive-currency-1',
    ])
        ->assertCreated()
        ->assertJsonPath('data.currency', 'DZD')
        ->assertJsonPath('data.provider', 'manual');

    $order = Order::query()->where('idempotency_key', 'derive-currency-1')->sole();

    expect($order->currency)->toBe('DZD')
        ->and($order->total)->toBe(2500)
        ->and($order->provider)->toBe('manual');
});

it('rejects a cart that mixes currencies', function () {
    $user = User::factory()->create();
    $dzd = hardeningCourse(['currency' => 'DZD']);
    $usd = hardeningCourse(['currency' => 'USD']);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/checkout', [
        'items' => [
            ['course_id' => $dzd->id],
            ['course_id' => $usd->id],
        ],
        'provider' => 'manual',
        'idempotency_key' => 'mixed-currency-1',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('items');

    expect(Order::query()->count())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
});

it('refuses stripe for a DZD course instead of charging a different currency', function () {
    $user = User::factory()->create();
    $course = hardeningCourse(['currency' => 'DZD']);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/checkout', [
        'items' => [['course_id' => $course->id]],
        'provider' => 'stripe',
        'idempotency_key' => 'dzd-stripe-1',
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Payment provider stripe does not support DZD payments.');

    expect(Order::query()->count())->toBe(0);
});

it('refuses PayPal while it is disabled and never creates an order', function () {
    $user = User::factory()->create();
    $course = hardeningCourse(['currency' => 'USD', 'price' => 1500]);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/checkout', [
        'items' => [['course_id' => $course->id]],
        'provider' => 'paypal',
        'idempotency_key' => 'paypal-disabled-1',
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Payment provider paypal is not enabled.');

    expect(Order::query()->count())->toBe(0);
});

it('defaults a DZD checkout to the manual provider', function () {
    $user = User::factory()->create();
    $course = hardeningCourse(['currency' => 'DZD']);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/checkout', [
        'items' => [['course_id' => $course->id]],
        'idempotency_key' => 'dzd-default-provider-1',
    ])
        ->assertCreated()
        ->assertJsonPath('data.provider', 'manual');

    expect(Order::query()->where('idempotency_key', 'dzd-default-provider-1')->sole()->provider)
        ->toBe('manual');
});

it('scopes checkout idempotency keys to the buyer', function () {
    $first = User::factory()->create();
    $second = User::factory()->create();
    $course = hardeningCourse(['currency' => 'DZD']);

    Sanctum::actingAs($first);
    $firstResponse = $this->postJson('/api/v1/checkout', [
        'items' => [['course_id' => $course->id]],
        'provider' => 'manual',
        'idempotency_key' => 'same-key',
    ])->assertCreated();

    Sanctum::actingAs($second);
    $secondResponse = $this->postJson('/api/v1/checkout', [
        'items' => [['course_id' => $course->id]],
        'provider' => 'manual',
        'idempotency_key' => 'same-key',
    ])->assertCreated();

    expect($firstResponse->json('data.order_id'))->not->toBe($secondResponse->json('data.order_id'))
        ->and(Order::query()->count())->toBe(2);
});

it('converts major units to minor units at the stripe boundary', function () {
    config(['services.stripe.secret' => 'sk_test_hardening']);

    $http = new PaymentHardeningFakeStripeClient();
    \Stripe\ApiRequestor::setHttpClient($http);

    $result = app(StripePaymentGateway::class)->createPayment(new CreatePaymentData(
        orderId: 'order-1',
        userId: '1',
        amount: 2500,
        currency: 'USD',
        provider: 'stripe',
        paymentMethodType: 'card',
        idempotencyKey: 'checkout-order-1-stripe',
    ));

    expect($http->requests)->toHaveCount(1)
        ->and($http->requests[0]['url'])->toContain('/v1/payment_intents')
        ->and($http->requests[0]['params']['amount'])->toBe(250000)
        ->and($http->requests[0]['params']['currency'])->toBe('usd')
        ->and($result->providerPaymentId)->toBe('pi_hardening_1');
});

it('sends a stripe refund in minor units and records repeat partial refunds', function () {
    Role::findOrCreate('Admin', 'web');
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    config(['services.stripe.secret' => 'sk_test_hardening']);

    $http = new PaymentHardeningFakeStripeClient();
    \Stripe\ApiRequestor::setHttpClient($http);

    $payment = Payment::create([
        'user_id' => $admin->id,
        'provider' => 'stripe',
        'provider_payment_id' => 'pi_refund_hardening',
        'payment_method_type' => 'card',
        'amount' => 2500,
        'currency' => 'USD',
        'status' => PaymentStatus::SUCCEEDED->value,
        'paid_at' => now(),
        'idempotency_key' => 'stripe-refund-hardening',
    ]);

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/payments/'.$payment->id.'/refund', [
            'amount' => 1000,
            'reason' => 'First partial',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'partially_refunded');

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/payments/'.$payment->id.'/refund', [
            'amount' => 1500,
            'reason' => 'Remaining balance',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'refunded');

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/payments/'.$payment->id.'/refund', ['amount' => 1])
        ->assertStatus(422);

    $refundRequests = array_values(array_filter(
        $http->requests,
        fn (array $request) => str_contains($request['url'], '/v1/refunds'),
    ));

    expect($refundRequests)->toHaveCount(2)
        ->and($refundRequests[0]['params']['amount'])->toBe(100000)
        ->and($refundRequests[1]['params']['amount'])->toBe(150000)
        ->and(PaymentTransaction::query()->where('payment_id', $payment->id)->count())->toBe(2)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::REFUNDED);
});

it('processes a duplicate success only once', function () {
    Event::fake([PaymentSucceeded::class]);

    $user = User::factory()->create();
    $order = Order::create([
        'user_id' => $user->id,
        'currency' => 'DZD',
        'subtotal' => 2500,
        'total' => 2500,
        'status' => 'pending',
        'provider' => 'manual',
        'idempotency_key' => 'idempotent-success-order',
        'placed_at' => now(),
    ]);

    $payment = Payment::create([
        'order_id' => $order->id,
        'user_id' => $user->id,
        'provider' => 'manual',
        'payment_method_type' => 'card',
        'amount' => 2500,
        'currency' => 'DZD',
        'status' => PaymentStatus::PENDING->value,
        'idempotency_key' => 'idempotent-success-payment',
    ]);

    $service = app(PaymentService::class);
    $service->markSucceeded($payment);
    $service->markSucceeded($payment->fresh());

    expect($payment->fresh()->status)->toBe(PaymentStatus::SUCCEEDED)
        ->and($order->fresh()->status)->toBe('paid')
        ->and(PaymentTransaction::query()->where('payment_id', $payment->id)->count())->toBe(1)
        ->and(Invoice::query()->where('order_id', $order->id)->count())->toBe(1);

    Event::assertDispatchedTimes(PaymentSucceeded::class, 1);

    $service->markFailed($payment->fresh(), 'late_failure', 'Late failure');

    expect($payment->fresh()->status)->toBe(PaymentStatus::SUCCEEDED);
});

it('claims a webhook event exactly once and allows failed events to retry', function () {
    $webhooks = app(HandleWebhookAction::class);

    $first = $webhooks->claim('stripe', 'evt_claim_1', 'payment_intent.succeeded', ['id' => 'evt_claim_1']);
    $second = $webhooks->claim('stripe', 'evt_claim_1', 'payment_intent.succeeded', ['id' => 'evt_claim_1']);

    expect($first['claimed'])->toBeTrue()
        ->and($second['claimed'])->toBeFalse()
        ->and($second['event']->status)->toBe(WebhookEvent::STATUS_PROCESSING);

    $webhooks->markFailed($first['event'], 'temporary failure');

    $retry = $webhooks->claim('stripe', 'evt_claim_1', 'payment_intent.succeeded', ['id' => 'evt_claim_1']);

    expect($retry['claimed'])->toBeTrue()
        ->and($retry['event']->attempts)->toBe(2)
        ->and($retry['event']->status)->toBe(WebhookEvent::STATUS_PROCESSING);

    $webhooks->markProcessed($retry['event']);

    $afterProcessing = $webhooks->claim('stripe', 'evt_claim_1', 'payment_intent.succeeded', ['id' => 'evt_claim_1']);

    expect($afterProcessing['claimed'])->toBeFalse()
        ->and($afterProcessing['event']->status)->toBe(WebhookEvent::STATUS_PROCESSED)
        ->and(WebhookEvent::query()->count())->toBe(1);
});

it('rejects a stripe webhook without an event id', function () {
    $this->postJson('/api/v1/webhooks/stripe', [
        'type' => 'payment_intent.succeeded',
        'data' => ['object' => ['id' => 'pi_missing_event']],
    ])
        ->assertStatus(400)
        ->assertJsonPath('message', 'Missing webhook event id.');

    expect(WebhookEvent::query()->count())->toBe(0);
});

it('acknowledges duplicate stripe webhook deliveries without processing twice', function () {
    $payload = [
        'id' => 'evt_duplicate_delivery',
        'type' => 'payment_intent.succeeded',
        'data' => ['object' => ['id' => 'pi_unknown_duplicate']],
    ];

    $this->postJson('/api/v1/webhooks/stripe', $payload)
        ->assertOk()
        ->assertJsonPath('message', 'Webhook processed.');

    $this->postJson('/api/v1/webhooks/stripe', $payload)
        ->assertOk()
        ->assertJsonPath('message', 'Already processed.');

    expect(WebhookEvent::query()->where('event_id', 'evt_duplicate_delivery')->count())->toBe(1);
});

it('fails closed when stripe is not configured in production', function () {
    $originalEnvironment = $this->app['env'];
    $this->app['env'] = 'production';
    config(['services.stripe.secret' => null]);

    try {
        expect(fn () => app(StripePaymentGateway::class)->createPayment(new CreatePaymentData(
            orderId: 'order-1',
            userId: '1',
            amount: 1000,
            currency: 'USD',
            provider: 'stripe',
            paymentMethodType: 'card',
            idempotencyKey: 'production-missing-secret',
        )))->toThrow(PaymentGatewayConfigurationException::class);

        $payment = Payment::create([
            'user_id' => User::factory()->create()->id,
            'provider' => 'stripe',
            'provider_payment_id' => 'pi_production_missing_secret',
            'payment_method_type' => 'card',
            'amount' => 1000,
            'currency' => 'USD',
            'status' => PaymentStatus::SUCCEEDED->value,
            'paid_at' => now(),
            'idempotency_key' => 'production-missing-secret-refund',
        ]);

        expect(fn () => app(StripePaymentGateway::class)->refund($payment, new RefundPaymentData(
            amount: 500,
            reason: 'test',
            idempotencyKey: 'production-missing-secret-refund-key',
        )))->toThrow(PaymentGatewayConfigurationException::class);
    } finally {
        $this->app['env'] = $originalEnvironment;
    }
});

it('never returns a fake PayPal payment even if the provider is enabled', function () {
    config(['payments.providers.paypal.enabled' => true]);

    expect(fn () => app(PayPalPaymentGateway::class)->createPayment(new CreatePaymentData(
        orderId: 'order-1',
        userId: '1',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
        paymentMethodType: 'card',
        idempotencyKey: 'paypal-no-stub',
    )))->toThrow(PaymentProviderUnavailableException::class);
});

it('does not create a subscription for a disabled provider', function () {
    $user = User::factory()->create();
    $plan = Plan::create([
        'name' => 'Professional',
        'slug' => 'professional-hardening',
        'price' => 2500,
        'currency' => 'USD',
        'interval' => 'month',
        'active' => true,
    ]);

    expect(fn () => app(SubscriptionService::class)->create($user, $plan->id, 'paypal'))
        ->toThrow(PaymentProviderUnavailableException::class);

    expect(Subscription::query()->count())->toBe(0);
});

class PaymentHardeningFakeStripeClient implements \Stripe\HttpClient\ClientInterface
{
    /** @var list<array{method: string, url: string, headers: array, params: array}> */
    public array $requests = [];

    public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
    {
        $this->requests[] = [
            'method' => $method,
            'url' => $absUrl,
            'headers' => $headers,
            'params' => $params,
        ];

        if (str_contains($absUrl, '/v1/refunds')) {
            $body = [
                'id' => 're_hardening_'.count($this->requests),
                'object' => 'refund',
                'status' => 'succeeded',
                'amount' => $params['amount'] ?? 0,
                'currency' => 'usd',
                'payment_intent' => $params['payment_intent'] ?? null,
            ];
        } else {
            $body = [
                'id' => 'pi_hardening_1',
                'object' => 'payment_intent',
                'status' => 'requires_action',
                'client_secret' => 'pi_hardening_secret',
                'amount' => $params['amount'] ?? 0,
                'currency' => $params['currency'] ?? 'usd',
            ];
        }

        return [json_encode($body), 200, []];
    }
}
