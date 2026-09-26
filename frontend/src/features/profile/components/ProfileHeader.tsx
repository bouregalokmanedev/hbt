import {
    ArrowRight,
    Camera,
    Check,
    Edit3,
    BadgeCheck,
    MessageCircle,
    Shuffle,
    Sparkles,
    Upload,
    X,
} from "lucide-react";

import {
    useRef,
    useState,
} from "react";

import { useTranslation } from "react-i18next";

import type { User } from "@/features/auth/types/auth.types";
import { BadgeIcon } from "@/features/dashboard/components/BadgeIcon";
import { UserAvatar } from "@/components/ui";
import {
    AVATAR_BG_COLORS,
    HAT_OPTIONS,
    SHIRT_OPTIONS,
    avatarDataUrl,
    avatarSvg,
    randomAvatarOptions,
    type GeneratedAvatarOptions,
} from "./AvatarGenerator";

interface ProfileHeaderProps {
    user: User;
    isEditing: boolean;
    onEdit: () => void;

    onAvatarChange?: (
        avatar: string | null,
    ) => void;
    avatar?: string | null;
    badges?: Array<{ id: string; title: string; icon: string }>;
}

export function ProfileHeader({
    user,
    isEditing,
    onEdit,
    onAvatarChange,
    avatar,
    badges = [],
}: ProfileHeaderProps) {
    const { t } = useTranslation();

    const roles = user.roles ?? [];
    const coverRole =
        roles.includes("Super Admin") || roles.includes("Admin")
            ? "admin"
            : roles.includes("Instructor")
              ? "instructor"
              : roles.includes("Support")
                ? "support"
                : "student";

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    const [showAvatarMenu, setShowAvatarMenu] =
        useState(false);

    const [showGenerator, setShowGenerator] =
        useState(false);

    const [gen, setGen] =
        useState<GeneratedAvatarOptions>(
            randomAvatarOptions,
        );

    const [avatarError, setAvatarError] =
        useState<string | null>(null);

    const displayAvatar =
        avatar !== undefined ? avatar : user.avatar;

    // Backend accepts avatar strings up to 2,000,000 chars.
    const MAX_AVATAR_CHARS = 1_900_000;

    const commitAvatar = (value: string) => {
        if (value.length > MAX_AVATAR_CHARS) {
            setAvatarError(
                t("profilePage.header.avatarErrorSize"),
            );
            return;
        }

        setAvatarError(null);
        onAvatarChange?.(value);
    };

    const handleUploadClick = () => {
        setAvatarError(null);
        fileInputRef.current?.click();
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setAvatarError(null);

        // Center-crop the photo to a square and scale it to 256x256 so every
        // stored avatar is square no matter the uploaded file's aspect ratio,
        // and PUT /v1/auth/profile accepts it (URL or data:image/, ≤2MB).
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            try {
                const side = Math.max(
                    1,
                    Math.min(img.width, img.height),
                );
                const sx = Math.max(
                    0,
                    Math.floor((img.width - side) / 2),
                );
                const sy = Math.max(
                    0,
                    Math.floor((img.height - side) / 2),
                );
                const canvas = document.createElement("canvas");
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("canvas");
                ctx.drawImage(
                    img,
                    sx,
                    sy,
                    side,
                    side,
                    0,
                    0,
                    256,
                    256,
                );
                commitAvatar(
                    canvas.toDataURL("image/jpeg", 0.82),
                );
            } catch {
                // Never store an uncropped (non-square) image.
                setAvatarError(
                    t("profilePage.header.avatarErrorSquare"),
                );
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            setAvatarError(
                t("profilePage.header.avatarErrorRead"),
            );
        };
        img.src = objectUrl;

        event.target.value = "";
        setShowAvatarMenu(false);
    };

    const handleApplyGenerated = () => {
        setAvatarError(null);
        onAvatarChange?.(avatarDataUrl(gen));
        setShowGenerator(false);
        setShowAvatarMenu(false);
    };

    const handleRemoveAvatar = () => {
        setAvatarError(null);
        onAvatarChange?.(null);
        setShowAvatarMenu(false);
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] shadow-[0_8px_30px_rgba(58,58,58,0.05)]">

            {/* =====================================================
                COVER
            ===================================================== */}

            <div className="relative h-[150px] overflow-hidden sm:h-[165px]">

                {/* Main background */}
                <div className="absolute inset-0 bg-[#343434]" />

                {/* Soft orange glow */}
                <div
                    className="
                        absolute
                        -right-20
                        -top-28
                        h-64
                        w-64
                        rounded-full
                        bg-[#F47822]/20
                        blur-[80px]
                    "
                />

                <div
                    className="
                        absolute
                        -bottom-24
                        left-1/4
                        h-52
                        w-52
                        rounded-full
                        bg-[#F47822]/8
                        blur-[70px]
                    "
                />

                {/* Very subtle technical grid */}
                <div
                    className="
                        absolute
                        inset-0
                        opacity-[0.025]
                    "
                    style={{
                        backgroundImage:
                            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                        backgroundSize:
                            "40px 40px",
                    }}
                />

                {/* Extremely subtle automotive details */}

                <div className="pointer-events-none absolute right-[8%] top-[20%] opacity-[0.025]">

                    <svg
                        width="130"
                        height="90"
                        viewBox="0 0 130 90"
                        fill="none"
                    >
                        <rect
                            x="25"
                            y="20"
                            width="65"
                            height="42"
                            rx="5"
                            stroke="white"
                            strokeWidth="2"
                        />

                        <path
                            d="M35 32H80"
                            stroke="white"
                            strokeWidth="2"
                        />

                        <path
                            d="M35 43H65"
                            stroke="white"
                            strokeWidth="2"
                        />

                        <path
                            d="M35 54H75"
                            stroke="white"
                            strokeWidth="2"
                        />

                        <path
                            d="M90 30L110 15"
                            stroke="white"
                            strokeWidth="2"
                        />

                        <circle
                            cx="105"
                            cy="65"
                            r="12"
                            stroke="white"
                            strokeWidth="2"
                        />
                    </svg>

                </div>

                {/* Diagnostic waveform */}

                <svg
                    className="pointer-events-none absolute bottom-5 left-[45%] w-56 opacity-[0.025]"
                    viewBox="0 0 240 60"
                    fill="none"
                >
                    <path
                        d="
                            M0 30
                            H35
                            L45 12
                            L55 48
                            L65 30
                            H95
                            L105 17
                            L115 43
                            L125 30
                            H160
                            L170 10
                            L180 50
                            L190 30
                            H240
                        "
                        stroke="white"
                        strokeWidth="2"
                    />
                </svg>

                {/* Cover text */}

                <div className="relative z-10 flex h-full items-start justify-between px-5 py-5 sm:px-7">

                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                            {t(`profilePage.header.cover.${coverRole}.eyebrow`)}
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                            {t(`profilePage.header.cover.${coverRole}.tagline`)}
                        </p>
                    </div>

                    {!isEditing && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="
                                flex
                                h-8
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-white/10
                                bg-white/[0.06]
                                px-3
                                text-[10px]
                                font-semibold
                                text-white/65
                                backdrop-blur-md
                                transition
                                hover:bg-white/10
                                hover:text-white
                            "
                        >
                            <Edit3 className="h-3 w-3" />

                            {t("profilePage.header.edit")}
                        </button>
                    )}

                </div>
            </div>

            {/* =====================================================
                PROFILE IDENTITY
            ===================================================== */}

            <div className="px-5 pb-5 sm:px-7">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

                    {/* Avatar */}

                    <div className="-mt-12 shrink-0">

                        <div className="relative">

                            {/*
                                Same component (and therefore the same fixed,
                                squared shape) as every other avatar in the
                                app — the layout never shifts between the
                                initials state and an uploaded picture.
                            */}

                            <UserAvatar
                                user={{
                                    avatar:
                                        displayAvatar,
                                    first_name:
                                        user.first_name,
                                    last_name:
                                        user.last_name,
                                }}
                                className="
                                    h-24
                                    w-24
                                    border-4
                                    border-white
                                    shadow-[0_8px_25px_rgba(0,0,0,0.12)]
                                "
                                fallbackClassName="
                                    bg-[#F47822]
                                    text-2xl
                                    font-bold
                                    text-white
                                "
                            />

                            {/* Avatar edit */}

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAvatarMenu(
                                        true,
                                    )
                                }
                                className="
                                    absolute
                                    bottom-1
                                    right-1
                                    flex
                                    h-7
                                    w-7
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border-2
                                    border-white
                                    bg-[#3A3A3A]
                                    text-white
                                    shadow-sm
                                    transition
                                    hover:bg-[#F47822]
                                "
                                title={t("profilePage.header.pictureTitle")}
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </button>

                        </div>
                    </div>

                    {/* Name */}

                    <div className="min-w-0 pb-1">

                        <h1 className="text-xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
                            {user.first_name}{" "}
                            {user.last_name}
                        </h1>

                        <p className="mt-0.5 text-xs text-[#3A3A3A]/40 dark:text-white/40">
                            @{user.username}
                        </p>

                    </div>
                    {badges.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{badges.map((badge) => <span key={badge.id} title={badge.title} className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/15 bg-[#F47822]/8 px-2.5 py-1 text-[9px] font-semibold text-[#F47822]"><BadgeIcon id={badge.id} title={badge.title} icon={badge.icon} className="h-3 w-3" />{badge.title}</span>)}</div>}

                </div>

                {/* =================================================
                    BIO
                ================================================= */}

                {user.bio && (
                    <div className="mt-5 rounded-xl border border-[#3A3A3A]/6 dark:border-white/6 bg-[#F7F7F7] dark:bg-[#101013] px-4 py-3.5">

                        <div className="flex items-start gap-3">

                            <div className="mt-0.5 h-7 w-1 rounded-full bg-[#F47822]" />

                            <div>

                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/30 dark:text-white/30">
                                    {t("profilePage.header.about")}
                                </p>

                                <p className="mt-1.5 text-sm leading-6 text-[#3A3A3A]/65 dark:text-white/65">
                                    {user.bio}
                                </p>

                            </div>

                        </div>

                    </div>
                )}

            </div>

            {/* =====================================================
                AVATAR MENU
            ===================================================== */}

            {showAvatarMenu && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3A3A3A]/30 dark:bg-white/30 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-sm rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-2xl">

                        <div className="flex items-center justify-between">

                            <div>

                                <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                    {t("profilePage.header.pictureTitle")}
                                </h2>

                                <p className="mt-1 text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                                    {t("profilePage.header.pictureDesc")}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAvatarMenu(
                                        false,
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3A3A3A]/35 dark:text-white/35 hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5"
                            >
                                <X className="h-4 w-4" />
                            </button>

                        </div>

                        <div className="mt-4 divide-y divide-[#3A3A3A]/6 overflow-hidden rounded-xl border border-[#3A3A3A]/8 dark:divide-white/6 dark:border-white/8">

                            {/* Upload */}

                            <button
                                type="button"
                                onClick={
                                    handleUploadClick
                                }
                                className="group flex w-full items-center gap-3 px-3.5 py-3 text-start transition hover:bg-[#F47822]/5"
                            >

                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3A3A3A]/5 dark:bg-white/5 transition group-hover:bg-[#F47822]/10">

                                    <Upload className="h-4 w-4 text-[#3A3A3A]/55 dark:text-white/55 group-hover:text-[#F47822]" />

                                </span>

                                <span className="min-w-0 flex-1">

                                    <span className="block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                        {t("profilePage.header.uploadTitle")}
                                    </span>

                                    <span className="mt-0.5 block truncate text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                                        {t("profilePage.header.uploadDesc")}
                                    </span>

                                </span>

                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/25 transition group-hover:text-[#F47822] rtl:-scale-x-100" />

                            </button>

                            {/* Generate */}

                            <button
                                type="button"
                                onClick={() => {
                                    setGen(
                                        randomAvatarOptions(),
                                    );

                                    setShowAvatarMenu(
                                        false,
                                    );

                                    setShowGenerator(
                                        true,
                                    );
                                }}
                                className="group flex w-full items-center gap-3 px-3.5 py-3 text-start transition hover:bg-[#F47822]/5"
                            >

                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F47822]/10 transition group-hover:bg-[#F47822]/20">

                                    <Sparkles className="h-4 w-4 text-[#F47822]" />

                                </span>

                                <span className="min-w-0 flex-1">

                                    <span className="block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                        {t("profilePage.header.generateTitle")}
                                    </span>

                                    <span className="mt-0.5 block truncate text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                                        {t("profilePage.header.generateDesc")}
                                    </span>

                                </span>

                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/25 transition group-hover:text-[#F47822] rtl:-scale-x-100" />

                            </button>

                            {/* Remove */}

                            {displayAvatar && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    className="group flex w-full items-center gap-3 px-3.5 py-3 text-start transition hover:bg-red-50 dark:hover:bg-red-500/5"
                                >

                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3A3A3A]/5 transition group-hover:bg-red-50 dark:bg-white/5 dark:group-hover:bg-red-500/10">

                                        <X className="h-4 w-4 text-[#3A3A3A]/55 transition group-hover:text-red-500 dark:text-white/55" />

                                    </span>

                                    <span className="min-w-0 flex-1">

                                        <span className="block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                            {t("profilePage.header.removeTitle")}
                                        </span>

                                        <span className="mt-0.5 block truncate text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                                            {t("profilePage.header.removeDesc")}
                                        </span>

                                    </span>

                                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/25 transition group-hover:text-red-500 rtl:-scale-x-100" />

                                </button>
                            )}

                        </div>

                        {avatarError && (
                            <p
                                role="alert"
                                className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600"
                            >
                                {avatarError}
                            </p>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={
                                handleFileChange
                            }
                        />

                    </div>
                </div>
            )}

            {/* =====================================================
                AVATAR GENERATOR — SKETCH ILLUSTRATION
            ===================================================== */}

            {showGenerator && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3A3A3A]/30 dark:bg-white/30 p-4 backdrop-blur-sm">

                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-5 shadow-2xl">

                        <div className="flex items-center justify-between">

                            <div>

                                <h2 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                    {t("profilePage.header.generateHeading")}
                                </h2>

                                <p className="mt-1 text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                                    {t("profilePage.header.generateBody")}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowGenerator(
                                        false,
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3A3A3A]/35 dark:text-white/35 hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5"
                            >
                                <X className="h-4 w-4" />
                            </button>

                        </div>

                        <div className="mt-5 flex flex-col gap-5 sm:flex-row">

                            {/* Live preview */}

                            <div className="flex shrink-0 flex-col items-center gap-2">

                                <div
                                    className="h-36 w-36 overflow-hidden rounded-[16.667%] shadow-[0_10px_30px_rgba(58,58,58,0.18)] [&_svg]:h-full [&_svg]:w-full"
                                    dangerouslySetInnerHTML={{
                                        __html: avatarSvg(gen),
                                    }}
                                />

                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35 dark:text-white/35">
                                    {t("profilePage.header.previewLabel")}
                                </p>

                            </div>

                            {/* Options */}

                            <div className="min-w-0 flex-1 space-y-4">

                                {/* Hat */}

                                <div>

                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35 dark:text-white/35">
                                        {t("profilePage.header.hatLabel")}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-1.5">

                                        {HAT_OPTIONS.map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                aria-pressed={gen.hat === option.id}
                                                onClick={() =>
                                                    setGen((current) => ({
                                                        ...current,
                                                        hat: option.id,
                                                    }))
                                                }
                                                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                                    gen.hat === option.id
                                                        ? "border-[#F47822] bg-[#F47822]/10 text-[#F47822]"
                                                        : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/55 hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#232329] dark:text-white/55"
                                                }`}
                                            >
                                                {t(option.labelKey)}
                                            </button>
                                        ))}

                                    </div>

                                </div>

                                {/* Color */}

                                <div>

                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35 dark:text-white/35">
                                        {t("profilePage.header.pickColor")}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-2">

                                        {AVATAR_BG_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                aria-pressed={gen.color === color}
                                                aria-label={t("profilePage.header.pickColorAria", { color })}
                                                onClick={() =>
                                                    setGen((current) => ({
                                                        ...current,
                                                        color,
                                                    }))
                                                }
                                                className={`relative flex h-8 w-8 items-center justify-center rounded-[10px] border-2 transition hover:scale-105 ${
                                                    gen.color === color
                                                        ? "border-[#F47822] shadow-md"
                                                        : "border-white shadow-sm"
                                                }`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {gen.color === color && (
                                                    <Check className="h-3.5 w-3.5 text-white" />
                                                )}
                                            </button>
                                        ))}

                                    </div>

                                </div>

                                {/* Shirt */}

                                <div>

                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35 dark:text-white/35">
                                        {t("profilePage.header.shirtLabel")}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-1.5">

                                        {SHIRT_OPTIONS.map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                aria-pressed={gen.shirt === option.id}
                                                onClick={() =>
                                                    setGen((current) => ({
                                                        ...current,
                                                        shirt: option.id,
                                                    }))
                                                }
                                                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                                    gen.shirt === option.id
                                                        ? "border-[#F47822] bg-[#F47822]/10 text-[#F47822]"
                                                        : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/55 hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#232329] dark:text-white/55"
                                                }`}
                                            >
                                                {t(option.labelKey)}
                                            </button>
                                        ))}

                                    </div>

                                </div>

                            </div>

                        </div>

                        <p className="mt-4 text-[10px] leading-4 text-[#3A3A3A]/40 dark:text-white/40">
                            {t("profilePage.header.generateNote")}
                        </p>

                        {avatarError && (
                            <p
                                role="alert"
                                className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600"
                            >
                                {avatarError}
                            </p>
                        )}

                        <div className="mt-4 flex gap-2">

                            <button
                                type="button"
                                onClick={() => setGen(randomAvatarOptions())}
                                className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/65 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white/65 dark:hover:border-[#F47822]/40 dark:hover:text-[#F47822]"
                            >
                                <Shuffle className="h-4 w-4" />
                                {t("profilePage.header.shuffle")}
                            </button>

                            <button
                                type="button"
                                onClick={handleApplyGenerated}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F47822] text-xs font-bold text-white transition hover:bg-[#df6817]"
                            >
                                <Sparkles className="h-4 w-4" />
                                {t("profilePage.header.useAvatar")}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </section>
    );
}
