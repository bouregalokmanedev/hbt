import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    OBD2_BRAND,
    brandFromSaved,
    type DiagnosisBrand,
    type DiagnosisRegion,
    type DiagnosisVariant,
    type SavedVehicle,
} from "./data";
import {
    BLUE,
    CARD_BORDER,
    CARD_BTN,
    CARD_FACE,
    CARD_SHADOW,
    GREY_GRADIENT,
    ModalShell,
    TopBar,
} from "./chrome";

/* Vehicle-selection screen: region tabs across the top, brand cards in a
   5-column scrollable grid. OBD II is pinned first on every tab. Cards with
   multiple variants open the chooser popup instead of going straight on. */

type GridEntry =
    | { kind: "brand"; brand: DiagnosisBrand }
    | { kind: "vehicle"; saved: SavedVehicle };

type Props = {
    brands: DiagnosisBrand[];
    loading: boolean;
    myVehicles: SavedVehicle[];
    vciConnected: boolean;
    onExit: () => void;
    onPick: (brand: DiagnosisBrand, variant: DiagnosisVariant) => void;
};

const TABS: { key: DiagnosisRegion; label: string }[] = [
    { key: "mine", label: "myVehicles" },
    { key: "asia", label: "asia" },
    { key: "china", label: "china" },
    { key: "europe", label: "europe" },
    { key: "america", label: "america" },
];

export function VehicleGridScreen({
    brands,
    loading,
    myVehicles,
    vciConnected,
    onExit,
    onPick,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";

    const [region, setRegion] = useState<DiagnosisRegion>("asia");
    const [searching, setSearching] = useState(false);
    const [query, setQuery] = useState("");
    const [chooser, setChooser] = useState<DiagnosisBrand | null>(null);
    const [vinPressed, setVinPressed] = useState(false);

    const entries = useMemo<GridEntry[]>(() => {
        let list: GridEntry[];
        if (region === "mine") {
            list = [
                { kind: "brand", brand: OBD2_BRAND },
                ...myVehicles
                    .filter((v) => !v.obd2)
                    .map((saved): GridEntry => ({ kind: "vehicle", saved })),
            ];
        } else {
            list = brands
                .filter((b) => b.region === region || b.obd2)
                .map((brand): GridEntry => ({ kind: "brand", brand }));
        }
        const q = query.trim().toUpperCase();
        if (q) {
            list = list.filter((e) =>
                (e.kind === "brand" ? e.brand.name : e.saved.brandName).includes(q),
            );
        }
        return list;
    }, [region, brands, myVehicles, query]);

    const openEntry = (entry: GridEntry) => {
        if (entry.kind === "vehicle") {
            onPick(brandFromSaved(entry.saved), entry.saved.variant);
            return;
        }
        const brand = entry.brand;
        if (brand.obd2 || brand.variants.length === 1) {
            onPick(brand, brand.variants[0]);
            return;
        }
        setChooser(brand);
    };

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar
                onBack={onExit}
                vciConnected={vciConnected}
                left={
                    <button
                        type="button"
                        aria-pressed={vinPressed}
                        onClick={() => setVinPressed((p) => !p)}
                        className="rounded-[0.7cqw] px-[1.2cqw] py-[0.7cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                        style={{
                            background: BLUE,
                            border: "1px solid #2461bd",
                            fontSize: "1.4cqw",
                            boxShadow: vinPressed
                                ? "inset 0 0.2cqw 0.5cqw rgba(0, 0, 0, 0.3)"
                                : "0 0.2cqw 0.5cqw rgba(47, 125, 225, 0.35)",
                        }}
                    >
                        {t(`${cs}.vin`)}
                    </button>
                }
                center={
                    searching ? (
                        <div className="flex items-center gap-[0.6cqw]">
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t(`${cs}.searchPh`)}
                                aria-label={t(`${cs}.search`)}
                                className="w-[26cqw] rounded-[0.7cqw] bg-white px-[1cqw] py-[0.6cqw] text-[#3f444c] placeholder:text-[#9aa1ab] focus:outline focus:outline-2 focus:outline-[#2f7de1]"
                                style={{ fontSize: "1.5cqw", border: "1px solid #b9c0c9" }}
                            />
                            <button
                                type="button"
                                aria-label={t(`${cs}.closeSearch`)}
                                onClick={() => {
                                    setSearching(false);
                                    setQuery("");
                                }}
                                className="grid aspect-square h-[2.6cqw] place-items-center rounded-[0.5cqw] text-[#5a616b] hover:brightness-[1.05]"
                                style={{ background: GREY_GRADIENT, border: "1px solid #b9c0c9" }}
                            >
                                <X style={{ width: "1.6cqw", height: "1.6cqw" }} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-end gap-[2.4cqw]">
                            {TABS.map((tab) => {
                                const active = region === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setRegion(tab.key)}
                                        className="relative pb-[0.9cqw] transition"
                                        style={{
                                            fontSize: "1.7cqw",
                                            fontWeight: active ? 700 : 500,
                                            color: active ? BLUE : "#5b626c",
                                        }}
                                    >
                                        {t(`${cs}.${tab.label}`)}
                                        <span
                                            className="absolute inset-x-0 bottom-0 rounded-full"
                                            style={{
                                                height: active ? "0.35cqw" : 0,
                                                background: BLUE,
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )
                }
                search={
                    <button
                        type="button"
                        aria-label={t(`${cs}.search`)}
                        onClick={() => setSearching((s) => !s)}
                        className="grid aspect-square h-[3cqw] place-items-center rounded-[0.6cqw] text-[#5a616b] transition hover:brightness-[1.04]"
                        style={{ background: GREY_GRADIENT, border: "1px solid #b6bcc4" }}
                    >
                        <Search style={{ width: "1.8cqw", height: "1.8cqw" }} />
                    </button>
                }
            />

            <div
                className="relative min-h-0 flex-1"
                style={{ background: "linear-gradient(180deg, #e9edf2 0%, #dde2e9 100%)" }}
            >
                {loading && entries.length === 0 ? (
                    <p
                        className="grid h-full place-items-center text-[#7d8590]"
                        style={{ fontSize: "1.6cqw" }}
                    >
                        {t(`${cs}.loading`)}
                    </p>
                ) : entries.length === 0 ? (
                    <p
                        className="grid h-full place-items-center text-[#7d8590]"
                        style={{ fontSize: "1.6cqw" }}
                    >
                        {t(`${cs}.noVehicles`)}
                    </p>
                ) : (
                    <div className="h-full overflow-y-auto p-[1.6cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="grid grid-cols-5 gap-[1.2cqw]">
                            {entries.map((entry) => (
                                <BrandCard
                                    key={
                                        entry.kind === "brand"
                                            ? entry.brand.id
                                            : `${entry.saved.brandId}:${entry.saved.variant.id}`
                                    }
                                    name={
                                        entry.kind === "brand"
                                            ? entry.brand.name
                                            : entry.saved.brandName
                                    }
                                    version={
                                        entry.kind === "brand"
                                            ? entry.brand.version
                                            : entry.saved.version
                                    }
                                    obd2={
                                        entry.kind === "brand"
                                            ? entry.brand.obd2
                                            : entry.saved.obd2
                                    }
                                    onClick={() => openEntry(entry)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {chooser ? (
                <ModalChooser
                    title={t(`${cs}.chooseVehicle`)}
                    cancelLabel={t(`${cs}.cancel`)}
                    brand={chooser}
                    onCancel={() => setChooser(null)}
                    onPick={(variant) => {
                        const brand = chooser;
                        setChooser(null);
                        onPick(brand, variant);
                    }}
                />
            ) : null}
        </div>
    );
}

function ModalChooser({
    title,
    cancelLabel,
    brand,
    onCancel,
    onPick,
}: {
    title: string;
    cancelLabel: string;
    brand: DiagnosisBrand;
    onCancel: () => void;
    onPick: (variant: DiagnosisVariant) => void;
}) {
    return (
        <ModalShell title={title} cancelLabel={cancelLabel} onCancel={onCancel}>
            <div className="max-h-[46cqw] overflow-y-auto">
                {brand.variants.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => onPick(v)}
                        className="flex w-full items-center justify-between px-[5%] py-[1.8cqw] text-start transition hover:bg-[#f1f5fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                        style={{ borderBottom: "1px solid #e4e7ec" }}
                    >
                        <span
                            className="font-semibold text-[#3f444c]"
                            style={{ fontSize: "1.65cqw" }}
                        >
                            {v.model} · {v.name}
                        </span>
                        <span className="text-[#8a919b]" style={{ fontSize: "1.4cqw" }}>
                            {v.years}
                        </span>
                    </button>
                ))}
            </div>
        </ModalShell>
    );
}

function BrandCard({
    name,
    version,
    obd2,
    onClick,
}: {
    name: string;
    version: string;
    obd2?: boolean;
    onClick: () => void;
}) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const label = `${t(`${cs}.diagnosisFor`)} ${name} ${version}`;
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`relative flex flex-col items-center justify-center px-[4%] py-[1.4cqw] ${CARD_BTN}`}
            style={{
                background: CARD_FACE,
                border: `1px solid ${CARD_BORDER}`,
                boxShadow: CARD_SHADOW,
                aspectRatio: "1.14 / 1",
            }}
        >
            <span
                className="absolute left-[7%] top-[8%] text-[#9aa1ab]"
                style={{ fontSize: "1.05cqw" }}
            >
                {t(`${cs}.diagnosisFor`)}
            </span>
            {obd2 ? (
                <ObdLogo />
            ) : (
                <span
                    className="px-[4%] text-center leading-tight font-bold text-[#3d4450]"
                    style={{ fontSize: "2cqw" }}
                >
                    {name}
                </span>
            )}
            <span className="mt-[8%] text-[#9aa1ab]" style={{ fontSize: "1.05cqw" }}>
                {version}
            </span>
        </button>
    );
}

/* Blue "OBD II" reader mark used on the generic card. */
function ObdLogo() {
    return (
        <svg viewBox="0 0 140 64" style={{ width: "62%", height: "auto" }} aria-hidden="true">
            <rect
                x="28"
                y="12"
                width="84"
                height="40"
                rx="7"
                fill="none"
                stroke="#2f7de1"
                strokeWidth="5"
            />
            <path
                d="M14 24 h14 M14 40 h14 M112 24 h14 M112 40 h14"
                stroke="#2f7de1"
                strokeWidth="5"
                strokeLinecap="round"
            />
            <text x="70" y="41" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2f7de1">
                OBD II
            </text>
        </svg>
    );
}
