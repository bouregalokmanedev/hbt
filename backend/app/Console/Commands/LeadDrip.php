<?php

namespace App\Console\Commands;

use App\Mail\LeadDripMail;
use App\Models\ContactMessage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Timed lead follow-ups. Runs daily; each eligible lead receives at most
 * one email per level, spaced by days since capture. Disabled by default —
 * flip MARKETING_DRIP_ENABLED=true once the templates are approved.
 */
class LeadDrip extends Command
{
    protected $signature = 'marketing:lead-drip {--force : Send even when the config gate is off}';

    protected $description = 'Send timed follow-up emails to open pipeline leads';

    public function handle(): int
    {
        if (! config('marketing.drip.enabled', false) && ! $this->option('force')) {
            $this->info('Lead drip disabled (set MARKETING_DRIP_ENABLED=true to activate).');

            return self::SUCCESS;
        }

        $sent = 0;
        $failed = 0;

        foreach ($this->eligible() as $lead) {
            try {
                Mail::to($lead->email)->send(new LeadDripMail($lead, $lead->drip_level + 1));
                $lead->activities()->create([
                    'type' => 'email',
                    'body' => 'drip:L'.($lead->drip_level + 1),
                ]);
                $lead->timestamps = false;
                $lead->forceFill(['drip_level' => $lead->drip_level + 1])->saveQuietly();
                $lead->timestamps = true;
                $sent++;
            } catch (\Throwable $exception) {
                $failed++;
                Log::warning('Lead drip send failed.', [
                    'contact_message_id' => $lead->id,
                    'level' => $lead->drip_level + 1,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $this->info("Drip complete: {$sent} sent, {$failed} failed.");

        return self::SUCCESS;
    }

    /**
     * One query per level window; drip_level guarantees each lead advances
     * at most one step per day.
     *
     * @return iterable<int, ContactMessage>
     */
    private function eligible(): iterable
    {
        $base = fn () => ContactMessage::query()
            ->whereNotNull('email')
            ->whereNull('converted_at')
            ->whereNotIn('status', ['won', 'lost']);

        return $base()->where('drip_level', 0)
            ->where('created_at', '<=', now()->subDay())
            ->lazyById(100)
            ->concat(
                $base()->where('drip_level', 1)
                    ->where('created_at', '<=', now()->subDays(3))
                    ->lazyById(100)
            )
            ->concat(
                $base()->where('drip_level', 2)
                    ->where('created_at', '<=', now()->subDays(7))
                    ->lazyById(100)
            );
    }
}
