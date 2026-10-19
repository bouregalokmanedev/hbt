<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('notifications:weekly-digest')
    ->weeklyOn(1, '09:00')
    ->withoutOverlapping();

Schedule::command('notifications:streak-nudge')
    ->dailyAt('18:00')
    ->withoutOverlapping();

Schedule::command('marketing:recover-carts', ['--hours' => 24])
    ->dailyAt('10:00')
    ->withoutOverlapping();

// Keep pipeline heat scores fresh for open leads.
Schedule::command('marketing:score-leads', ['--hours' => 24])
    ->everyFifteenMinutes()
    ->withoutOverlapping();

// Timed lead follow-ups (gated by MARKETING_DRIP_ENABLED).
Schedule::command('marketing:lead-drip')
    ->dailyAt('11:00')
    ->withoutOverlapping();
