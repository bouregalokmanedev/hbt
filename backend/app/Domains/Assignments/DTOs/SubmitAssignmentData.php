<?php

namespace App\Domains\Assignments\DTOs;

final readonly class SubmitAssignmentData
{
    public function __construct(
        public ?string $content,
        public ?string $linkUrl,
    ) {
    }

    public static function fromArray(array $data): self
    {
        $content = isset($data['content'])
            ? trim((string) $data['content'])
            : '';
        $linkUrl = isset($data['link_url'])
            ? trim((string) $data['link_url'])
            : '';

        return new self(
            content: $content === '' ? null : $content,
            linkUrl: $linkUrl === '' ? null : $linkUrl,
        );
    }
}
