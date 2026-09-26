<?php

namespace App\Domains\Lessons\Services;

/**
 * Defense-in-depth HTML sanitizer for lesson bodies.
 * The SPA also sanitizes with DOMPurify on render; this strips the
 * most dangerous vectors before they ever reach the database.
 */
class LessonContentSanitizer
{
    public function sanitize(string $html): string
    {
        // Remove script/style/iframe/object/embed frames entirely.
        $html = preg_replace(
            '#<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*>.*?<\s*/\s*\1\s*>#is',
            '',
            $html
        ) ?? $html;

        // Remove any remaining opening tags for those elements (unclosed).
        $html = preg_replace(
            '#<\s*/?\s*(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*>#i',
            '',
            $html
        ) ?? $html;

        // Strip on* event handlers.
        $html = preg_replace(
            '#\son[a-z]+\s*=\s*(".*?"|\'.*?\'|[^\s>]+)#is',
            '',
            $html
        ) ?? $html;

        // Neutralize javascript: / data:text/html URIs in href/src.
        $html = preg_replace(
            '#\s(href|src|action|xlink:href)\s*=\s*("|\'|\s*)\s*(javascript|data:text/html|vbscript):[^"\'>\s]*("|\'|\s*)#i',
            ' $1="#"',
            $html
        ) ?? $html;

        return $html;
    }
}
