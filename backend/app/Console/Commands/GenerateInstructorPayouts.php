<?php

namespace App\Console\Commands;

use App\Domains\Payments\Services\InstructorPayoutAutomationService;
use Illuminate\Console\Command;

class GenerateInstructorPayouts extends Command
{
    protected $signature = 'payouts:generate {--period= : Period YYYY-MM}';
    protected $description = 'Auto-generate pending instructor payouts for the period (70% share).';

    public function handle(InstructorPayoutAutomationService $service): int
    {
        $payouts = $service->generateForPeriod($this->option('period'));
        $this->info(count($payouts) ? count($payouts).' payout(s) generated.' : 'No eligible revenue.');
        foreach ($payouts as $payout) {
            $this->line("- {$payout->instructor?->full_name} — {$payout->amount} {$payout->currency} ({$payout->period})");
        }
        return self::SUCCESS;
    }
}
