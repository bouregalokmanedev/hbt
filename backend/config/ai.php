<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Mentor limits
    |--------------------------------------------------------------------------
    |
    | These are safe application defaults. Plan-specific limits can later be
    | supplied by the subscription domain without changing the mentor pipeline.
    |
    */
    'limits' => [
        'daily_requests' => (int) env('AI_MENTOR_DAILY_REQUEST_LIMIT', 100),
        'monthly_requests' => (int) env('AI_MENTOR_MONTHLY_REQUEST_LIMIT', 2000),
        'daily_tokens' => (int) env('AI_MENTOR_DAILY_TOKEN_LIMIT', 100000),
        'monthly_tokens' => (int) env('AI_MENTOR_MONTHLY_TOKEN_LIMIT', 1000000),
    ],
];
