<?php

namespace App\Domains\Simulator\Support;

/**
 * The scanner lab identifies vehicles by the garage card key, which is
 * `backend:<variant uuid>` for catalog-backed vehicles and a plain string
 * (`golf`, `demo-vehicle`, …) for the static ones. Sessions store that key
 * verbatim, so every read that needs a display name or a catalog match has
 * to agree on one canonical form — otherwise the same car shows up twice
 * (once as `backend:<uuid>`, once as the bare uuid with 0 sessions).
 */
final class VehicleKey
{
    private const BACKEND_PREFIX = 'backend:';

    /** Canonical form used for catalog lookups, grouping and filters. */
    public static function normalize(?string $key): string
    {
        $key = trim((string) $key);

        if ($key !== '' && str_starts_with($key, self::BACKEND_PREFIX)) {
            $key = substr($key, strlen(self::BACKEND_PREFIX));
        }

        return $key;
    }

    /** Form written to the DB on new sessions (never prefixed). */
    public static function forStorage(?string $key): string
    {
        return self::normalize($key);
    }
}
