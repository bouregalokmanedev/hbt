import { useTranslation } from "react-i18next";
import {
    Battery,
    Car,
    ChevronLeft,
    CircleArrowUp,
    FilePlus2,
    Grid2x2,
    Laptop,
    Menu,
    MessageCircle,
    Monitor,
    ScanSearch,
    Search,
    Settings,
    Sun,
    Volume2,
    Wrench,
} from "lucide-react";

/* Faithful DOM rebuild of the XTOOL scanner screen — same buttons, icons
   and colors as the original artwork, but real markup: crisp at any size
   (no image upscaling) and every control is a live button. The panel keeps
   a fixed size and stays centered; it never scales up to fill the layout. */

const BLUE_TOP = "linear-gradient(180deg, #4e71cb 0%, #4160b4 55%, #33509d 100%)";
const BLUE_MID = "linear-gradient(180deg, #4869c1 0%, #3c5aae 55%, #2f4d99 100%)";
const BLUE_BOTTOM = "linear-gradient(180deg, #3b58a6 0%, #2f4d96 55%, #244489 100%)";
const RED_ROW = "linear-gradient(180deg, #b5485f 0%, #9d3a56 100%)";
const RED_PANEL = "linear-gradient(180deg, #a84c67 0%, #8e3450 45%, #792b3f 100%)";
const TOP_BAR = "linear-gradient(180deg, #93a0b7 0%, #8791aa 100%)";
const TOOLBAR = "linear-gradient(180deg, #8d9aad 0%, #717b8e 100%)";

const BTN = `
    cursor-pointer
    rounded-[1.2cqw]
    border
    border-white/0
    text-white
    transition
    duration-200
    hover:border-white/70
    hover:brightness-125
    focus-visible:border-white
    focus-visible:brightness-125
    focus-visible:outline-none
`;

type ScreenItem = {
    id: string;
    label: string;
    to: string;
    Icon: typeof Wrench;
    top: string;
    height: string;
    background: string;
};

const SIDE_ITEMS: ScreenItem[] = [
    { id: "special", label: "Special Function", to: "/simulator/scanner", Icon: Wrench, top: "14.2%", height: "27.5%", background: BLUE_TOP },
    { id: "report", label: "Report", to: "/reports", Icon: FilePlus2, top: "42.2%", height: "27%", background: BLUE_MID },
    { id: "remote", label: "Remote Control", to: "/demo", Icon: Laptop, top: "69.9%", height: "24.2%", background: BLUE_BOTTOM },
];

const RIGHT_ITEMS: ScreenItem[] = [
    { id: "updates", label: "Updates", to: "/announcements", Icon: CircleArrowUp, top: "14.2%", height: "27.5%", background: BLUE_TOP },
    { id: "setting", label: "Setting", to: "/settings", Icon: Settings, top: "42.2%", height: "27%", background: BLUE_MID },
    { id: "more", label: "More", to: "/catalog", Icon: Grid2x2, top: "69.9%", height: "24.2%", background: BLUE_BOTTOM },
];

const TOOLBAR_ICONS = [ChevronLeft, Menu, Volume2, Sun, Monitor];

type Props = {
    onOpen: (to: string) => void;
};

const ScannerScreenUI = ({ onOpen }: Props) => {
    const { t } = useTranslation();

    return (
        <div
            style={{ containerType: "inline-size" }}
            className="
                w-[min(760px,92vw,120vh)]
                select-none
            "
        >
            <div
                role="group"
                aria-label={t("landingPage.hero.screenAlt")}
                className="
                    aspect-[628/442]
                    rounded-[1.8cqw]
                    bg-[#4a4e5c]
                    p-[1.2cqw]
                    shadow-[0_30px_90px_rgba(0,0,0,0.55)]
                "
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
            >
                <div
                    className="
                        relative
                        h-full
                        w-full
                        overflow-hidden
                        rounded-[1cqw]
                    "
                    style={{
                        background: "linear-gradient(140deg, #c6d6e9 0%, #b7c6da 55%, #c8d8e9 100%)",
                    }}
                >
                    {/* ================= TOP STATUS BAR ================= */}

                    <div
                        className="
                            absolute
                            inset-x-0
                            top-0
                            flex
                            items-center
                            justify-between
                            px-[2.4cqw]
                        "
                        style={{ height: "13.3%", background: TOP_BAR }}
                    >
                        <button
                            type="button"
                            title="Tech Support"
                            aria-label="Tech Support"
                            onClick={() => onOpen("/help")}
                            className={`
                                ${BTN}
                                -ml-[1.2cqw]
                                inline-flex
                                items-center
                                gap-[0.9cqw]
                                px-[1.2cqw]
                                py-[0.6cqw]
                            `}
                            style={{ fontSize: "2.1cqw" }}
                        >
                            <MessageCircle
                                strokeWidth={2.2}
                                style={{ width: "2.9cqw", height: "2.9cqw" }}
                            />

                            <span className="font-semibold">Tech Support</span>
                        </button>

                        <span
                            className="
                                font-black
                                italic
                                tracking-[0.02em]
                            "
                            style={{ fontSize: "3.6cqw" }}
                        >
                            XTOOL
                        </span>

                        <span className="flex items-center gap-[0.8cqw]">
                            <span
                                className="font-semibold"
                                style={{ fontSize: "2cqw" }}
                            >
                                54%
                            </span>

                            <Battery
                                strokeWidth={2}
                                style={{ width: "3.6cqw", height: "3.6cqw" }}
                            />
                        </span>
                    </div>

                    {/* ================= LEFT COLUMN ================= */}

                    {SIDE_ITEMS.map(({ id, label, to, Icon, top, height, background }) => (
                        <button
                            key={id}
                            type="button"
                            title={label}
                            aria-label={label}
                            onClick={() => onOpen(to)}
                            className={`
                                ${BTN}
                                absolute
                                flex
                                flex-col
                                items-center
                                justify-center
                                gap-[1.3cqw]
                            `}
                            style={{
                                left: "0.5%",
                                width: "27%",
                                top,
                                height,
                                background,
                            }}
                        >
                            <Icon
                                strokeWidth={1.9}
                                style={{ width: "6.4cqw", height: "6.4cqw" }}
                            />

                            <span
                                className="font-bold"
                                style={{ fontSize: "2.3cqw" }}
                            >
                                {label}
                            </span>
                        </button>
                    ))}

                    {/* ================= CENTER — AUTO SCAN + DIAGNOSIS ================= */}

                    <button
                        type="button"
                        title="Auto Scan"
                        aria-label="Auto Scan"
                        onClick={() => onOpen("/simulator")}
                        className={`
                            ${BTN}
                            absolute
                            flex
                            items-center
                            justify-center
                            gap-[1.6cqw]
                        `}
                        style={{
                            left: "30.6%",
                            width: "39.1%",
                            top: "18.9%",
                            height: "23.5%",
                            background: RED_ROW,
                        }}
                    >
                        <ScanSearch
                            strokeWidth={2}
                            style={{ width: "5.6cqw", height: "5.6cqw" }}
                        />

                        <span
                            className="font-extrabold tracking-[0.06em]"
                            style={{ fontSize: "2.8cqw" }}
                        >
                            AUTO SCAN
                        </span>
                    </button>

                    <button
                        type="button"
                        title="Diagnosis"
                        aria-label="Diagnosis"
                        onClick={() => onOpen("/diagnostics")}
                        className={`
                            ${BTN}
                            absolute
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-[1.4cqw]
                        `}
                        style={{
                            left: "30.6%",
                            width: "39.1%",
                            top: "42.9%",
                            height: "49.1%",
                            background: RED_PANEL,
                        }}
                    >
                        <span
                            className="relative block"
                            style={{ fontSize: "11cqw", lineHeight: 0 }}
                        >
                            <Car
                                strokeWidth={1.6}
                                style={{ width: "1em", height: "1em" }}
                            />

                            <Search
                                strokeWidth={2.6}
                                className="
                                    absolute
                                    bottom-[0.02em]
                                    right-[-0.06em]
                                "
                                style={{ width: "0.44em", height: "0.44em" }}
                            />
                        </span>

                        <span
                            className="font-bold"
                            style={{ fontSize: "2.7cqw" }}
                        >
                            Diagnosis
                        </span>
                    </button>

                    {/* ================= CENTER TOOLBAR ================= */}

                    <div
                        aria-hidden="true"
                        className="
                            absolute
                            flex
                            items-center
                            justify-around
                            rounded-[0.6cqw]
                            px-[1cqw]
                            text-white/75
                        "
                        style={{
                            left: "27.9%",
                            width: "45%",
                            top: "92.5%",
                            height: "6.8%",
                            background: TOOLBAR,
                        }}
                    >
                        {TOOLBAR_ICONS.map((Icon, index) => (
                            <Icon
                                key={index}
                                strokeWidth={2}
                                style={{ width: "2.5cqw", height: "2.5cqw" }}
                            />
                        ))}
                    </div>

                    {/* ================= RIGHT COLUMN ================= */}

                    {RIGHT_ITEMS.map(({ id, label, to, Icon, top, height, background }) => (
                        <button
                            key={id}
                            type="button"
                            title={label}
                            aria-label={label}
                            onClick={() => onOpen(to)}
                            className={`
                                ${BTN}
                                absolute
                                flex
                                flex-col
                                items-center
                                justify-center
                                gap-[1.3cqw]
                            `}
                            style={{
                                left: "72.8%",
                                width: "26.7%",
                                top,
                                height,
                                background,
                            }}
                        >
                            <Icon
                                strokeWidth={1.9}
                                style={{ width: "6.4cqw", height: "6.4cqw" }}
                            />

                            <span
                                className="font-bold"
                                style={{ fontSize: "2.3cqw" }}
                            >
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScannerScreenUI;
