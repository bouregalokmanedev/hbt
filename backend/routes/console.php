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
