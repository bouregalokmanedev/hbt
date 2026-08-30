import type {
    ReactNode,
} from "react";

import {
    AuthLanguageSwitch,
} from "../i18n/AuthLanguageSwitch";

import {
    useAuthLanguage,
} from "../i18n/auth-language";

import authBackground from "@/assets/brand/auth-background-11.png";

interface AuthShellProps {
    children: ReactNode;
}

export function AuthShell({
    children,
}: AuthShellProps) {
    const {
        language,
    } = useAuthLanguage();

    const isArabic =
        language === "ar";

    return (
        <main
            dir={
                isArabic
                    ? "rtl"
                    : "ltr"
            }
            className={
                isArabic
                    ? "h-[100dvh] w-full overflow-hidden bg-[#F3F3F3] font-cairo"
                    : "h-[100dvh] w-full overflow-hidden bg-[#F3F3F3]"
            }
        >
            <div className="flex h-full w-full items-center justify-center p-0 sm:p-4 lg:p-6">
                <div className="relative flex h-full w-full overflow-hidden bg-[#F7F7F7] shadow-none sm:h-[min(900px,calc(100dvh-2rem))] sm:max-w-[1440px] sm:rounded-[28px] sm:shadow-[0_24px_80px_rgba(58,58,58,0.12)] lg:h-[min(860px,calc(100dvh-3rem))]">

                    {/* =====================================================
                        BRAND PANEL
                    ===================================================== */}

                    <section className="relative hidden h-full w-[43%] shrink-0 overflow-hidden lg:block">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${authBackground})`,
                            }}
                        />

                        <div className="absolute inset-0 bg-[#F47822]/10" />

                        <div className="absolute inset-0 bg-gradient-to-br from-[#3A3A3A]/20 via-transparent to-[#F47822]/20" />

                        <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10">

                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg">
                                    <span className="text-lg font-black text-[#F47822]">
                                        H
                                    </span>
                                </div>

                                <div className="text-white">
                                    <p className="text-lg font-bold tracking-tight">
                                        HBT
                                    </p>

                                    <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/70">
                                        Learning Platform
                                    </p>
                                </div>
                            </div>

                            {/* Brand message */}
                            <div className="max-w-sm text-white">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                                    Automotive Diagnostics
                                </p>

                                <h2 className="text-3xl font-semibold leading-tight xl:text-4xl">
                                    Build stronger
                                    <br />
                                    diagnostic skills.
                                </h2>

                                <p className="mt-4 text-sm leading-6 text-white/75">
                                    Learn automotive diagnostics
                                    through structured courses,
                                    practical scenarios and
                                    real technical knowledge.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-xs text-white/65">
                                <span>
                                    ©{" "}
                                    {new Date().getFullYear()}{" "}
                                    HB Tronics
                                </span>

                                <span>
                                    E-learning Platform
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        RIGHT SIDE
                    ===================================================== */}

                    <section className="relative flex h-full min-w-0 flex-1 flex-col bg-[#F7F7F7]">

                        {/* Language switch */}
                        <div className="absolute right-5 top-5 z-30 sm:right-7 sm:top-7">
                            <AuthLanguageSwitch />
                        </div>

                        {/* =================================================
                            SCROLLABLE FORM AREA

                            IMPORTANT:
                            This is the ONLY element that scrolls.
                        ================================================= */}

                        <div
                            className="
                                h-full
                                w-full
                                overflow-y-auto
                                overscroll-contain
                                scroll-smooth
                                px-5
                                py-20
                                sm:px-8
                                sm:py-20
                                md:px-12
                                lg:px-16
                                xl:px-20

                                [scrollbar-width:thin]
                                [scrollbar-color:#D4D4D4_transparent]

                                [&::-webkit-scrollbar]:w-1.5
                                [&::-webkit-scrollbar-track]:bg-transparent
                                [&::-webkit-scrollbar-thumb]:rounded-full
                                [&::-webkit-scrollbar-thumb]:bg-[#D4D4D4]
                                hover:[&::-webkit-scrollbar-thumb]:bg-[#BDBDBD]
                            "
                        >
                            <div className="flex min-h-full w-full items-center justify-center">
                                <div className="w-full max-w-[460px] py-4">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}