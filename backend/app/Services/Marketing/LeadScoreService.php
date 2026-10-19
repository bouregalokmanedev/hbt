<?php

namespace App\Services\Marketing;

use App\Domains\Analytics\Models\AnalyticsEvent;
use App\Models\ContactMessage;
use App\Models\User;

/**
 * Lead scoring: turns the behavioural trail we already store (analytics
 * events stitched by visitor_id, plus conversion/enrollment) into a 0–100
 * heat score so the sales board can be sorted by real intent.
 */
class LeadScoreService
{
    /** Event weights, capped per event type so one obsessive visitor can't max a score alone. */
    private const WEIGHTS = [
        'page_view' => 1,
        'time_on_page' => 2,
        'cta_click' => 5,
        'pricing_viewed' => 25,
        'plan_cta_clicked' => 30,
        'simulator_limit_reached' => 10,
        'referral_invite_shared' => 5,
    ];

    private const CAPS = [
        'page_view' => 10,
        'time_on_page' => 10,
        'cta_click' => 10,
        'pricing_viewed' => 50,
        'plan_cta_clicked' => 60,
        'simulator_limit_reached' => 20,
        'referral_invite_shared' => 10,
    ];

    public const BONUS_SIGNED_UP = 20;

    public const BONUS_ENROLLED = 25;

    /**
     * Compute and persist the score for one lead (by visitor trail + email match).
     */
    public function score(ContactMessage $lead): int
    {
        $score = 0;

        $visitorIds = array_values(array_unique(array_filter([
            $lead->visitor_id,
            ...$this->visitorIdsForEmail($lead->email),
        ])));

        if ($visitorIds !== []) {
            $counts = AnalyticsEvent::query()
                ->selectRaw('event, COUNT(*) AS total')
                ->whereIn('visitor_id', $visitorIds)
                ->groupBy('event')
                ->pluck('total', 'event');

            foreach ($counts as $event => $total) {
                $weight = self::WEIGHTS[$event] ?? 0;
                $cap = self::CAPS[$event] ?? 0;
                $score += min((int) $total * $weight, $cap);
            }
        }

        if ($lead->converted_at !== null) {
            $score += self::BONUS_SIGNED_UP;
        }

        if ($this->hasEnrollment($lead)) {
            $score += self::BONUS_ENROLLED;
        }

        $score = min($score, 100);

        if ((int) $lead->score !== $score) {
            $lead->timestamps = false;
            $lead->forceFill(['score' => $score])->saveQuietly();
            $lead->timestamps = true;
        }

        return $score;
    }

    /**
     * Refresh scores in bulk for the console command / index warm-up.
     */
    public function scoreMany(iterable $leads): void
    {
        foreach ($leads as $lead) {
            $this->score($lead);
        }
    }

    /** Distinct visitor_ids tied to this email: prior captures + stitched user events. */
    private function visitorIdsForEmail(?string $email): array
    {
        if (! $email) {
            return [];
        }

        $needle = mb_strtolower($email);

        $captured = ContactMessage::query()
            ->whereRaw('LOWER(email) = ?', [$needle])
            ->whereNotNull('visitor_id')
            ->pluck('visitor_id');

        $stitched = AnalyticsEvent::query()
            ->whereNotNull('visitor_id')
            ->whereIn('user_id', fn ($sub) => $sub
                ->select('id')
                ->from('users')
                ->whereRaw('LOWER(email) = ?', [$needle]))
            ->distinct()
            ->pluck('visitor_id');

        return $captured->concat($stitched)->unique()->values()->all();
    }

    private function hasEnrollment(ContactMessage $lead): bool
    {
        $emails = array_filter([mb_strtolower((string) $lead->email)]);
        if ($emails === []) {
            return false;
        }

        return User::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($lead->email)])
            ->whereHas('enrollments')
            ->exists();
    }
}
