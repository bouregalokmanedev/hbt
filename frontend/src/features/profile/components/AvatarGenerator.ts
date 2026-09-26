export type GeneratedHat =
    | "none"
    | "cap"
    | "beanie"
    | "crown"
    | "tophat"
    | "bucket"
    | "helmet"
    | "headphones"
    | "bandana";

export type GeneratedShirt =
    | "tee"
    | "polo"
    | "hoodie"
    | "coverall"
    | "labcoat";

export interface GeneratedAvatarOptions {
    hat: GeneratedHat;
    shirt: GeneratedShirt;
    color: string;
}

export const AVATAR_BG_COLORS = [
    "#F47822",
    "#3A3A3A",
    "#2563EB",
    "#059669",
    "#7C3AED",
    "#DB2777",
    "#0EA5E9",
    "#F59E0B",
    "#F43F5E",
    "#4F46E5",
    "#0D9488",
    "#65A30D",
] as const;

export const HAT_OPTIONS: Array<{
    id: GeneratedHat;
    labelKey: string;
}> = [
    { id: "none", labelKey: "profilePage.header.hatNone" },
    { id: "cap", labelKey: "profilePage.header.hatCap" },
    { id: "beanie", labelKey: "profilePage.header.hatBeanie" },
    { id: "crown", labelKey: "profilePage.header.hatCrown" },
    { id: "tophat", labelKey: "profilePage.header.hatTopHat" },
    { id: "bucket", labelKey: "profilePage.header.hatBucket" },
    { id: "helmet", labelKey: "profilePage.header.hatHelmet" },
    { id: "headphones", labelKey: "profilePage.header.hatHeadphones" },
    { id: "bandana", labelKey: "profilePage.header.hatBandana" },
];

export const SHIRT_OPTIONS: Array<{
    id: GeneratedShirt;
    labelKey: string;
}> = [
    { id: "tee", labelKey: "profilePage.header.shirtTee" },
    { id: "polo", labelKey: "profilePage.header.shirtPolo" },
    { id: "hoodie", labelKey: "profilePage.header.shirtHoodie" },
    { id: "coverall", labelKey: "profilePage.header.shirtCoverall" },
    { id: "labcoat", labelKey: "profilePage.header.shirtLabcoat" },
];

const INK = "#2E2E2E";
const SKIN = "#F7C9A6";
const GOLD = "#F5C542";

const SCHEMES: Record<string, { hat: string; shirt: string }> = {
    "#F47822": { hat: "#FFFFFF", shirt: "#3A3A3A" },
    "#3A3A3A": { hat: "#F47822", shirt: "#FFFFFF" },
    "#2563EB": { hat: "#FFFFFF", shirt: "#1D4ED8" },
    "#059669": { hat: "#FFFFFF", shirt: "#047857" },
    "#7C3AED": { hat: "#FFFFFF", shirt: "#6D28D9" },
    "#DB2777": { hat: "#FFFFFF", shirt: "#BE185D" },
    "#0EA5E9": { hat: "#FFFFFF", shirt: "#0369A1" },
    "#F59E0B": { hat: "#3A3A3A", shirt: "#B45309" },
    "#F43F5E": { hat: "#FFFFFF", shirt: "#BE123C" },
    "#4F46E5": { hat: "#FFFFFF", shirt: "#3730A3" },
    "#0D9488": { hat: "#FFFFFF", shirt: "#115E59" },
    "#65A30D": { hat: "#3A3A3A", shirt: "#3F6212" },
};

function hatArt(
    hat: GeneratedHat,
    hatColor: string,
): string {
    switch (hat) {
        case "cap":
            return [
                `<path d="M170 94C206 92 228 104 224 122C208 134 182 128 166 114C158 106 160 96 170 94Z" fill="${hatColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<path d="M74 100a54 54 0 0 1 108 0v8H74z" fill="${hatColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<circle cx="128" cy="46" r="7" fill="${hatColor}" stroke="${INK}" stroke-width="4"/>`,
                `<path d="M128 46v62" stroke="${INK}" stroke-width="3" opacity="0.3" fill="none"/>`,
            ].join("");
        case "beanie":
            return [
                `<path d="M74 96a54 64 0 0 1 108 0v6H74z" fill="${hatColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<rect x="68" y="76" width="120" height="24" rx="12" fill="${hatColor}" stroke="${INK}" stroke-width="5"/>`,
                `<path d="M86 88h84" stroke="${INK}" stroke-width="3" opacity="0.3" fill="none"/>`,
                `<circle cx="128" cy="32" r="11" fill="${hatColor}" stroke="${INK}" stroke-width="4"/>`,
            ].join("");
        case "crown":
            return [
                `<path d="M76 100V50L98 78L114 46L128 72L142 46L158 78L180 50V100Z" fill="${GOLD}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<rect x="76" y="78" width="104" height="22" rx="7" fill="${GOLD}" stroke="${INK}" stroke-width="5"/>`,
                `<circle cx="128" cy="89" r="5" fill="#F47822" stroke="${INK}" stroke-width="2.5"/>`,
                `<circle cx="102" cy="89" r="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2.5"/>`,
                `<circle cx="154" cy="89" r="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2.5"/>`,
            ].join("");
        case "tophat":
            return [
                `<path d="M88 90V40h80v50z" fill="${hatColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<rect x="88" y="70" width="80" height="20" fill="#F47822" stroke="${INK}" stroke-width="4"/>`,
                `<rect x="66" y="90" width="124" height="14" rx="7" fill="${hatColor}" stroke="${INK}" stroke-width="5"/>`,
            ].join("");
        case "bucket":
            return [
                `<ellipse cx="128" cy="104" rx="76" ry="15" fill="${hatColor}" stroke="${INK}" stroke-width="5"/>`,
                `<path d="M84 100a44 46 0 0 1 88 0v4H84z" fill="${hatColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<path d="M86 78h84" stroke="${INK}" stroke-width="3" opacity="0.3" fill="none"/>`,
            ].join("");
        case "helmet":
            return [
                `<rect x="60" y="92" width="136" height="16" rx="8" fill="${hatColor}" stroke="${INK}" stroke-width="5"/>`,
                `<path d="M78 94a50 48 0 0 1 100 0z" fill="${hatColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<path d="M128 52v42" stroke="${INK}" stroke-width="4" opacity="0.3" fill="none"/>`,
                `<path d="M56 100c8 12 26 18 44 18h56c18 0 36-6 44-18" fill="none" stroke="${INK}" stroke-width="4" opacity="0.35"/>`,
            ].join("");
        case "headphones":
            return [
                `<path d="M64 126a64 64 0 0 1 128 0" fill="none" stroke="${hatColor}" stroke-width="13" stroke-linecap="round"/>`,
                `<path d="M64 126a64 64 0 0 1 128 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity="0.35"/>`,
                `<rect x="46" y="112" width="32" height="46" rx="14" fill="${hatColor}" stroke="${INK}" stroke-width="5"/>`,
                `<rect x="178" y="112" width="32" height="46" rx="14" fill="${hatColor}" stroke="${INK}" stroke-width="5"/>`,
                `<path d="M56 126h12M188 126h12" stroke="${INK}" stroke-width="4" opacity="0.35"/>`,
            ].join("");
        case "bandana":
            return [
                `<path d="M74 98a54 48 0 0 1 108 0v6H74z" fill="${hatColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<path d="M74 100h108" stroke="${INK}" stroke-width="4" opacity="0.35" fill="none"/>`,
                `<path d="M84 96q44-14 88 0" fill="none" stroke="${INK}" stroke-width="4" opacity="0.35"/>`,
                `<path d="M180 104l24 2-20 16z" fill="${hatColor}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
            ].join("");
        case "none":
        default:
            return "";
    }
}

function shirtArt(
    shirt: GeneratedShirt,
    shirtColor: string,
): string {
    switch (shirt) {
        case "polo":
            return [
                `<path d="M104 194l16 8M152 194l-16 8" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
                `<path d="M110 198l18 24 18-24" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<path d="M128 224v30" stroke="${INK}" stroke-width="4" opacity="0.65" fill="none"/>`,
                `<circle cx="128" cy="232" r="3" fill="${INK}"/>`,
                `<circle cx="128" cy="246" r="3" fill="${INK}"/>`,
            ].join("");
        case "hoodie":
            return [
                `<path d="M82 210c6-20 26-32 46-32s40 12 46 32c-16-12-30-16-46-16s-30 4-46 16z" fill="${shirtColor}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<path d="M114 214v34M142 214v34" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
                `<rect x="96" y="236" width="64" height="20" rx="7" fill="none" stroke="${INK}" stroke-width="4"/>`,
            ].join("");
        case "coverall":
            return [
                `<path d="M100 196l22 18M156 196l-22 18" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
                `<path d="M128 212v46" stroke="${INK}" stroke-width="5" fill="none"/>`,
                `<rect x="96" y="222" width="22" height="17" rx="3" fill="none" stroke="${INK}" stroke-width="3.5"/>`,
                `<rect x="138" y="222" width="22" height="17" rx="3" fill="none" stroke="${INK}" stroke-width="3.5"/>`,
                `<rect x="140" y="196" width="22" height="11" rx="3" fill="#FFFFFF" stroke="${INK}" stroke-width="3.5"/>`,
            ].join("");
        case "labcoat":
            return [
                `<path d="M44 256C44 214 82 192 128 192C174 192 212 214 212 256Z" fill="#FFFFFF" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
                `<path d="M128 194l-16 26 16 36 16-36z" fill="${shirtColor}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
                `<path d="M84 250v-14M172 250v-14" stroke="${INK}" stroke-width="3.5" opacity="0.5" fill="none"/>`,
                `<rect x="146" y="230" width="24" height="15" rx="3" fill="none" stroke="${INK}" stroke-width="3.5"/>`,
            ].join("");
        case "tee":
        default:
            return [
                `<path d="M104 196q24 20 48 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
                `<path d="M78 216q14-14 26-18M178 216q-14-14-26-18" stroke="${INK}" stroke-width="4" opacity="0.6" fill="none"/>`,
            ].join("");
    }
}

/**
 * Sketch-style square avatar: illustrated head, hat, shirt style and a flat
 * background color. Pure SVG string so it can be previewed in the DOM and
 * stored as a `data:image/svg+xml` avatar.
 */
export function avatarSvg({
    hat,
    shirt,
    color,
}: GeneratedAvatarOptions): string {
    const scheme =
        SCHEMES[color] ?? SCHEMES["#F47822"];
    const hatColor =
        hat === "crown" ? GOLD : scheme.hat;

    const hair =
        hat === "none"
            ? `<path d="M74 126C70 74 96 52 128 52C160 52 186 74 182 126C177 104 167 92 151 90C135 88 123 96 109 92C94 88 80 104 74 126Z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
            : `<path d="M76 128C70 108 72 92 82 82C80 100 84 116 90 128Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M180 128C186 108 184 92 174 82C176 100 172 116 166 128Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

    const parts = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">`,
        `<rect width="256" height="256" rx="42.67" fill="${color}"/>`,
        `<path d="M112 158h32v30c0 12-7 19-16 19s-16-7-16-19z" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`,
        `<path d="M44 256C44 214 82 192 128 192C174 192 212 214 212 256Z" fill="${scheme.shirt}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
        `<ellipse cx="128" cy="124" rx="54" ry="58" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>`,
        `<circle cx="72" cy="130" r="11" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`,
        `<circle cx="184" cy="130" r="11" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`,
        hair,
        `<circle cx="108" cy="126" r="5.5" fill="${INK}"/>`,
        `<circle cx="148" cy="126" r="5.5" fill="${INK}"/>`,
        `<path d="M97 110q11-7 21-2" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`,
        `<path d="M138 108q11-5 21 2" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`,
        `<path d="M127 126c4 12 3 17-4 20" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
        `<path d="M109 148q19 16 38 0" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
        shirtArt(shirt, scheme.shirt),
        hatArt(hat, hatColor),
        `</svg>`,
    ];

    return parts.join("");
}

export function avatarDataUrl(
    options: GeneratedAvatarOptions,
): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        avatarSvg(options),
    )}`;
}

export function randomAvatarOptions(): GeneratedAvatarOptions {
    const pick = <T,>(values: readonly T[]): T =>
        values[
            Math.floor(Math.random() * values.length)
        ];

    return {
        hat: pick(HAT_OPTIONS).id,
        shirt: pick(SHIRT_OPTIONS).id,
        color: pick(AVATAR_BG_COLORS),
    };
}
