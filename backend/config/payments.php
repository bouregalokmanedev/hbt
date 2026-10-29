<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supported display/checkout currencies
    |--------------------------------------------------------------------------
    |
    | A course or plan may only be priced in one of these currencies. The
    | provider-level lists below decide which gateway can actually process a
    | given currency. Keeping the two separate prevents a DZD-priced course
    | from being silently charged as USD by Stripe.
    |
    */

    'supported_currencies' => [
        'DZD', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'TND', 'MAD',
    ],

    /*
    |--------------------------------------------------------------------------
    | Webhook claim lease
    |--------------------------------------------------------------------------
    |
    | A provider event is claimed before processing. If the worker dies while
    | handling it, another delivery may re-claim the event after this many
    | seconds. This prevents concurrent duplicate deliveries from both
    | fulfilling an order.
    |
    */

    'webhook_claim_ttl' => (int) env('PAYMENT_WEBHOOK_CLAIM_TTL', 300),

    'providers' => [

        'stripe' => [
            'enabled' => env('STRIPE_ENABLED', true),
            // Stripe does not support DZD. Add a local gateway for DZD, or
            // price the course in one of these currencies.
            'currencies' => [
                'USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD',
                'OMR', 'JOD', 'EGP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK',
                'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'TRY', 'ILS',
                'JPY', 'SGD', 'HKD', 'NZD', 'ZAR',
            ],
        ],

        'paypal' => [
            'enabled' => env('PAYPAL_ENABLED', false),
            'currencies' => [
                'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'CHF',
                'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN',
                'TRY', 'ILS', 'JPY', 'SGD', 'HKD', 'NZD', 'ZAR', 'MXN', 'BRL',
            ],
        ],

        // Bank transfer / cash / local settlement. An administrator confirms
        // the payment from the admin console; no provider API is called.
        'manual' => [
            'enabled' => env('MANUAL_PAYMENTS_ENABLED', true),
            'currencies' => ['*'],
        ],

    ],

];
