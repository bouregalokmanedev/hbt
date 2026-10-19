<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Lead drip follow-ups
    |--------------------------------------------------------------------------
    |
    | Timed follow-up emails to open pipeline leads (day 1 thank-you,
    | day 3 pricing nudge, day 7 social proof). Off by default so the
    | sequence never fires before the templates are reviewed.
    |
    */
    'drip' => [
        'enabled' => (bool) env('MARKETING_DRIP_ENABLED', false),
    ],
];
