<?php

namespace App\Domains\StudentAssessments\DTOs;

final class SaveResponseData
{
    public function __construct(
        public readonly string $attemptId,
        public readonly string $questionId,
        public readonly mixed $answer = null,
        public readonly ?array $answerMetadata = null,
        public readonly ?string $confidenceLevel = null,
        public readonly ?bool $isFlagged = null,
        public readonly ?int $timeSpentSeconds = null,
        public readonly ?string $responseType = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            attemptId: $data['attempt_id'],
            questionId: $data['question_id'],
            answer: $data['answer'] ?? $data['selected_option_ids'] ?? $data['value'] ?? null,
            answerMetadata: $data['answer_metadata'] ?? null,
            confidenceLevel: $data['confidence_level'] ?? null,
            isFlagged: isset($data['is_flagged']) ? (bool) $data['is_flagged'] : null,
            timeSpentSeconds: isset($data['time_spent_seconds']) ? (int) $data['time_spent_seconds'] : null,
            responseType: $data['response_type'] ?? null,
        );
    }

    public function toAnswerPayload(): array
    {
        if (is_array($this->answer)) {
            // Already a shaped payload (selected_option_ids / ordered_ids /
            // matches / value) — pass through so the scorer can dispatch.
            if (
                isset($this->answer['selected_option_ids'])
                || isset($this->answer['selected_option_id'])
                || isset($this->answer['option_ids'])
                || isset($this->answer['ordered_ids'])
                || isset($this->answer['matches'])
                || array_key_exists('value', $this->answer)
            ) {
                return $this->answer;
            }

            if (array_is_list($this->answer)) {
                return ['selected_option_ids' => $this->answer];
            }

            return $this->answer;
        }

        return ['value' => $this->answer];
    }
}
