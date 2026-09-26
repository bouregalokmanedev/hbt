<?php

namespace App\Domains\StudentAssessments\Enums;

enum IntegrityEventType: string
{
    case ATTEMPT_STARTED = 'attempt_started';
    case ATTEMPT_RESUMED = 'attempt_resumed';
    case QUESTION_OPENED = 'question_opened';
    case QUESTION_ANSWERED = 'question_answered';
    case QUESTION_FLAGGED = 'question_flagged';
    case QUESTION_UNFLAGGED = 'question_unflagged';
    case TAB_BLUR = 'tab_blur';
    case TAB_FOCUS = 'tab_focus';
    case WINDOW_BLUR = 'window_blur';
    case WINDOW_FOCUS = 'window_focus';
    case DEVICE_CHANGED = 'device_changed';
    case SESSION_CHANGED = 'session_changed';
    case SUBMISSION_STARTED = 'submission_started';
    case SUBMISSION_COMPLETED = 'submission_completed';
    case ATTEMPT_ABANDONED = 'attempt_abandoned';
    case ATTEMPT_EXPIRED = 'attempt_expired';
    case COPY_ATTEMPT = 'copy_attempt';
    case PASTE_ATTEMPT = 'paste_attempt';
    case RIGHT_CLICK = 'right_click';
    case DEV_TOOLS_OPENED = 'dev_tools_opened';
    case FULLSCREEN_EXIT = 'fullscreen_exit';
    case SCREENSHOT_ATTEMPT = 'screenshot_attempt';
    case TIME_WARNING = 'time_warning'; // 5 min, 1 min warnings

    public function severity(): string
    {
        return match ($this) {
            self::DEVICE_CHANGED, self::SESSION_CHANGED, self::COPY_ATTEMPT,
            self::PASTE_ATTEMPT, self::DEV_TOOLS_OPENED, self::FULLSCREEN_EXIT,
            self::SCREENSHOT_ATTEMPT => 'high',
            self::TAB_BLUR, self::WINDOW_BLUR, self::RIGHT_CLICK => 'medium',
            self::ATTEMPT_STARTED, self::ATTEMPT_RESUMED, self::QUESTION_OPENED,
            self::QUESTION_ANSWERED, self::QUESTION_FLAGGED, self::QUESTION_UNFLAGGED,
            self::TAB_FOCUS, self::WINDOW_FOCUS, self::SUBMISSION_STARTED,
            self::SUBMISSION_COMPLETED, self::ATTEMPT_ABANDONED, self::ATTEMPT_EXPIRED,
            self::TIME_WARNING => 'low',
        };
    }

    public function isSuspicious(): bool
    {
        return in_array($this, [
            self::DEVICE_CHANGED, self::SESSION_CHANGED, self::COPY_ATTEMPT,
            self::PASTE_ATTEMPT, self::DEV_TOOLS_OPENED, self::FULLSCREEN_EXIT,
            self::SCREENSHOT_ATTEMPT,
        ]);
    }
}