<?php

namespace App\Domains\AI\Services;

final class MentorTokenEstimator
{
    public function estimate(string $text): int
    {
        if ($text === '') {
            return 0;
        }

        return (int) ceil(mb_strlen($text) / 4);
    }

    public function estimateMessages(array $messages): int
    {
        $tokens = 0;

        foreach ($messages as $message) {
            $tokens += 4;

            $tokens += $this->estimate(
                (string) ($message['content'] ?? '')
            );
        }

        return $tokens;
    }
}