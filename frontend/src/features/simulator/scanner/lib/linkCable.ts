/* Row-space path of the link cable that joins the tablet's rear dock cable
   to the plug inside the OBD Link station. Coordinates are row per-mille
   (0..1000 across the stage + gap + tool row) measured from the live app:
   the dock cable ends at ~(204, 1024) and the station cable clips at the
   panel corner ~(822, 877). Between them the run stays flat in the narrow
   band just below the stage (y ~1013, stroke top clearing the stage edge,
   bottom grazing the viewport) so the whole cable stays visible at any
   window height. RTL mirrors the layout (station on the left), so it gets
   its own run. */

const LTR =
    "M 204 1023.5 C 211 1018, 224 1013.4, 250 1013" +
    " C 360 1012.5, 560 1013.3, 690 1013.5" +
    " C 740 1013.5, 775 1013.2, 794 1012.7" +
    " C 799 1012.3, 802 1008, 803.5 1000" +
    " C 807 986, 808 948, 806 922" +
    " C 805 904, 808 892, 814 886" +
    " C 818 882, 821 879, 822 877";

const RTL =
    "M 410 1023.5 C 403 1018, 390 1013.4, 364 1013" +
    " C 320 1012.5, 265 1013.3, 236 1013.5" +
    " C 226 1013.5, 212 1013.4, 206 1012.7" +
    " C 204.5 1012.3, 203.5 1006.5, 202.5 1000" +
    " C 200.5 986, 198.5 952, 197 930" +
    " C 196 922, 190 914, 170 911" +
    " C 130 906, 60 905, 26 908" +
    " C 16 910, 12 900, 12 888" +
    " C 12 883, 12 880, 12 877";

export function linkCablePath(rtl: boolean): string {
    return rtl ? RTL : LTR;
}
