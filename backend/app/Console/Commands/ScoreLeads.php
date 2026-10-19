<?php

namespace App\Console\Commands;

use App\Models\ContactMessage;
use App\Services\Marketing\LeadScoreService;
use Illuminate\Console\Command;

/**
 * Refresh lead heat scores for open leads so the pipeline board is always
 * sorted by real intent, not by who typed their email in first.
 */
class ScoreLeads extends Command
{
    protected $signature = 'marketing:score-leads {--hours=24 : Only refresh leads captured or updated in this window}';

    protected $description = 'Recompute behavioural lead scores (0-100) for open pipeline leads';

    public function handle(LeadScoreService $service): int
    {
        $hours = max(1, (int) $this->option('hours'));

        ContactMessage::query()
            ->whereNotIn('status', ['won', 'lost'])
            ->where(function ($query) use ($hours) {
                $query->where('created_at', '>=', now()->subHours($hours))
                    ->orWhere('updated_at', '>=', now()->subHours($hours))
                    ->orWhereNull('score');
            })
            ->lazyById(200)
            ->each(fn (ContactMessage $lead) => $service->score($lead));

        $this->info('Lead scores refreshed.');

        return self::SUCCESS;
    }
}
