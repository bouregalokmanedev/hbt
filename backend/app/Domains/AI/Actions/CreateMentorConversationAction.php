<?php

namespace App\Domains\AI\Actions;

use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Services\MentorContextService;
use App\Models\User;

final class CreateMentorConversationAction
{
    public function __construct(
        private MentorContextService $contextService,
    ) {
    }

    public function execute(
        User $user,
        ?string $courseId = null,
        ?string $lessonId = null,
        ?string $title = null,
    ): MentorConversation {
        $context = $this->contextService->build(
            user: $user,
            courseId: $courseId,
            lessonId: $lessonId,
        );

        if ($courseId !== null && $context->courseId === null) {
            throw new \LogicException(
                'The user is not enrolled in the selected course.'
            );
        }

        if ($lessonId !== null && $context->lessonContext === null) {
            throw new \LogicException(
                'The selected lesson is unavailable in this enrolled course.'
            );
        }

        return MentorConversation::create([
            'user_id' => $user->id,
            'course_id' => $context->courseId,
            'lesson_id' => $context->lessonId,
            'title' => $title,
            'context' => $context->toArray(),
            'status' => 'active',
        ]);
    }
}
