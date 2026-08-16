import {
    Camera,
    Edit3,
    BadgeCheck,
    MessageCircle,
    UserRoundPlus,
    ImagePlus,
    Sparkles,
    Upload,
    X,
} from "lucide-react";

import {
    useRef,
    useState,
} from "react";

import type { User } from "@/features/auth/types/auth.types";

interface ProfileHeaderProps {
    user: User;
    isEditing: boolean;
    onEdit: () => void;

    onAvatarChange?: (
        avatar: string,
    ) => void;
}

export function ProfileHeader({
    user,
    isEditing,
    onEdit,
    onAvatarChange,
}: ProfileHeaderProps) {
    const fileInputRef =
        useRef<HTMLInputElement>(null);

    const [showAvatarMenu, setShowAvatarMenu] =
        useState(false);

    const [showGenerator, setShowGenerator] =
        useState(false);

    const initials =
        `${user.first_name?.charAt(0) ?? ""}${user.last_name?.charAt(0) ?? ""}`
            .toUpperCase();

    const handleUploadClick = () => {
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

        const reader = new FileReader();

        reader.onload = () => {
            if (
                typeof reader.result ===
                "string"
            ) {
                onAvatarChange?.(
                    reader.result,
                );
            }
        };

        reader.readAsDataURL(file);

        event.target.value = "";
        setShowAvatarMenu(false);
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_30px_rgba(58,58,58,0.05)]">

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
                            HBT Learning
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                            Learn. Practice. Diagnose.
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

                            Edit profile
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

                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={`${user.first_name} ${user.last_name}`}
                                    className="
                                        h-24
                                        w-24
                                        rounded-2xl
                                        border-4
                                        border-white
                                        object-cover
                                        shadow-[0_8px_25px_rgba(0,0,0,0.12)]
                                    "
                                />
                            ) : (
                                <div
                                    className="
                                        flex
                                        h-24
                                        w-24
                                        items-center
                                        justify-center
                                        rounded-2xl
                                        border-4
                                        border-white
                                        bg-[#F47822]
                                        text-2xl
                                        font-bold
                                        text-white
                                        shadow-[0_8px_25px_rgba(0,0,0,0.12)]
                                    "
                                >
                                    {initials}
                                </div>
                            )}

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
                                title="Change profile picture"
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </button>

                        </div>
                    </div>

                    {/* Name */}

                    <div className="min-w-0 pb-1">

                        <h1 className="text-xl font-bold tracking-tight text-[#3A3A3A]">
                            {user.first_name}{" "}
                            {user.last_name}
                        </h1>

                        <p className="mt-0.5 text-xs text-[#3A3A3A]/40">
                            @{user.username}
                        </p>

                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">

    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/15 bg-[#F47822]/8 px-2.5 py-1 text-[9px] font-semibold text-[#F47822]">
        <UserRoundPlus className="h-3 w-3" />
        New learner
    </span>

    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3A3A3A]/8 bg-[#3A3A3A]/5 px-2.5 py-1 text-[9px] font-semibold text-[#3A3A3A]/55">
        <BadgeCheck className="h-3 w-3" />
        Member
    </span>

</div>

                </div>

                {/* =================================================
                    BIO
                ================================================= */}

                {user.bio && (
                    <div className="mt-5 rounded-xl border border-[#3A3A3A]/6 bg-[#F7F7F7] px-4 py-3.5">

                        <div className="flex items-start gap-3">

                            <div className="mt-0.5 h-7 w-1 rounded-full bg-[#F47822]" />

                            <div>

                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/30">
                                    About
                                </p>

                                <p className="mt-1.5 text-sm leading-6 text-[#3A3A3A]/65">
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3A3A3A]/30 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-sm rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-2xl">

                        <div className="flex items-center justify-between">

                            <div>

                                <h2 className="text-sm font-bold text-[#3A3A3A]">
                                    Profile picture
                                </h2>

                                <p className="mt-1 text-[11px] text-[#3A3A3A]/40">
                                    Choose how you want to represent yourself.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAvatarMenu(
                                        false,
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3A3A3A]/35 hover:bg-[#3A3A3A]/5"
                            >
                                <X className="h-4 w-4" />
                            </button>

                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">

                            {/* Upload */}

                            <button
                                type="button"
                                onClick={
                                    handleUploadClick
                                }
                                className="
                                    group
                                    rounded-xl
                                    border
                                    border-[#3A3A3A]/8
                                    p-4
                                    text-left
                                    transition
                                    hover:border-[#F47822]/30
                                    hover:bg-[#F47822]/5
                                "
                            >

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3A3A3A]/5 transition group-hover:bg-[#F47822]/10">

                                    <Upload className="h-4 w-4 text-[#3A3A3A]/55 group-hover:text-[#F47822]" />

                                </div>

                                <p className="mt-3 text-xs font-semibold text-[#3A3A3A]">
                                    Upload photo
                                </p>

                                <p className="mt-1 text-[10px] leading-4 text-[#3A3A3A]/40">
                                    Choose an image from your device.
                                </p>

                            </button>

                            {/* Generate */}

                            <button
                                type="button"
                                onClick={() => {
                                    setShowAvatarMenu(
                                        false,
                                    );

                                    setShowGenerator(
                                        true,
                                    );
                                }}
                                className="
                                    group
                                    rounded-xl
                                    border
                                    border-[#3A3A3A]/8
                                    p-4
                                    text-left
                                    transition
                                    hover:border-[#F47822]/30
                                    hover:bg-[#F47822]/5
                                "
                            >

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F47822]/10">

                                    <Sparkles className="h-4 w-4 text-[#F47822]" />

                                </div>

                                <p className="mt-3 text-xs font-semibold text-[#3A3A3A]">
                                    Generate avatar
                                </p>

                                <p className="mt-1 text-[10px] leading-4 text-[#3A3A3A]/40">
                                    Create a professional avatar.
                                </p>

                            </button>

                        </div>

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
                AVATAR GENERATOR PLACEHOLDER
            ===================================================== */}

            {showGenerator && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3A3A3A]/30 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-2xl">

                        <div className="flex items-center justify-between">

                            <div>

                                <h2 className="text-sm font-bold text-[#3A3A3A]">
                                    Generate your avatar
                                </h2>

                                <p className="mt-1 text-[11px] text-[#3A3A3A]/40">
                                    Create a professional profile avatar.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowGenerator(
                                        false,
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3A3A3A]/35 hover:bg-[#3A3A3A]/5"
                            >
                                <X className="h-4 w-4" />
                            </button>

                        </div>

                        <div className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/10 bg-[#F7F7F7] p-8 text-center">

                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47822]/10">

                                <ImagePlus className="h-5 w-5 text-[#F47822]" />

                            </div>

                            <p className="mt-4 text-xs font-semibold text-[#3A3A3A]">
                                Avatar generation
                            </p>

                            <p className="mx-auto mt-1 max-w-[260px] text-[10px] leading-4 text-[#3A3A3A]/40">
                                The avatar generator can be connected to your AI image service here.
                            </p>

                        </div>

                    </div>
                </div>
            )}

        </section>
    );
}