<?php

namespace App\Enums\Bootcamps;

/**
 * Physical training sites plus the online option.
 *
 * The values are stable API identifiers; the English/Arabic labels live in
 * the frontend dictionary so every surface can translate them together.
 */
enum BootcampSite: string
{
    case EL_OUED = 'el_oued';
    case ALGIERS = 'algiers';
    case SAUDI = 'saudi';

    /*
     * Retained so registrations created before the campus consolidation
     * continue to hydrate and render correctly.
     */
    case ALGIERS_HYDRA = 'algiers_hydra';
    case ALGIERS_CENTRE = 'algiers_centre';
    case ORAN = 'oran';
    case CONSTANTINE = 'constantine';
    case ONLINE = 'online';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
