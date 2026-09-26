<?php

namespace App\Domains\RiskManagement\Actions;

use App\Domains\RiskManagement\Models\Risk;

class ReviewRiskAction
{
    public function execute(Risk $risk, int $reviewerId, string $outcome = 'continued', ?string $notes = null, ?string $nextReviewAt = null): Risk
    {
        $risk->reviews()->create([
            'reviewer_id' => $reviewerId,
            'outcome' => $outcome,
            'notes' => $notes,
            'next_review_at' => $nextReviewAt ? \Carbon\Carbon::parse($nextReviewAt) : now()->addDays(30),
        ]);

        $risk->update([
            'next_review_at' => $nextReviewAt ? \Carbon\Carbon::parse($nextReviewAt) : now()->addDays(30),
            'status' => $outcome === 'closed' ? 'closed' : $risk->status,
            'closed_at' => $outcome === 'closed' ? now() : null,
        ]);

        return $risk->fresh();
    }
}
