import {
    Activity,
    Award,
    Cpu,
    Gauge,
    GraduationCap,
} from "lucide-react";

import { motion } from "framer-motion";

export function AuthBrandPanel() {
    return (
        <section
            className="
                relative
                hidden
                h-full
                w-full
                shrink-0
                overflow-hidden
                bg-[#1557D6]
                text-white
                lg:flex
                lg:w-[43%]
                lg:flex-col
            "
        >
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

                <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
                        backgroundSize: "42px 42px",
                    }}
                />
            </div>

            <div className="relative z-10 flex min-h-full flex-1 flex-col justify-between p-10 xl:p-12">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-blue-700 shadow-lg">
                        H
                    </div>

                    <div>
                        <p className="text-lg font-bold tracking-tight">
                            HBT
                        </p>

                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-blue-100">
                            Learning Platform
                        </p>
                    </div>
                </div>

                {/* Main content */}
                <div className="relative">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
                        Automotive Diagnostics
                    </p>

                    <h1 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
                        Learn.
                        <br />
                        Diagnose.
                        <br />
                        Master.
                    </h1>

                    <p className="mt-6 max-w-md text-sm leading-6 text-blue-100 xl:text-base">
                        Build real diagnostic skills through
                        structured courses, practical scenarios,
                        and industry-focused certification.
                    </p>

                    {/* Diagnostic visual */}
                    <div className="relative mt-10 max-w-md">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity
                                        size={15}
                                        className="text-blue-100"
                                    />

                                    <span className="text-xs font-medium text-blue-100">
                                        Diagnostic Lab
                                    </span>
                                </div>

                                <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                    LIVE
                                </span>
                            </div>

                            {/* Waveform */}
                            <div className="flex h-20 items-center gap-1 overflow-hidden">
                                {Array.from({
                                    length: 42,
                                }).map((_, index) => {
                                    const heights = [
                                        18,
                                        24,
                                        14,
                                        30,
                                        20,
                                        42,
                                        62,
                                        35,
                                        18,
                                        25,
                                        48,
                                        70,
                                        38,
                                        22,
                                        16,
                                        32,
                                        54,
                                        28,
                                        18,
                                        45,
                                        65,
                                        36,
                                        20,
                                        28,
                                        52,
                                        72,
                                        42,
                                        24,
                                        18,
                                        38,
                                        58,
                                        30,
                                        20,
                                        44,
                                        68,
                                        34,
                                        18,
                                        28,
                                        50,
                                        32,
                                        22,
                                        40,
                                    ];

                                    return (
                                        <motion.span
                                            key={index}
                                            initial={{
                                                scaleY: 0.7,
                                            }}
                                            animate={{
                                                scaleY: 1,
                                            }}
                                            transition={{
                                                duration: 1.2,
                                                repeat: Infinity,
                                                repeatType: "reverse",
                                                delay: index * 0.015,
                                            }}
                                            className="w-1 origin-center rounded-full bg-white/70"
                                            style={{
                                                height: `${heights[index]}%`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Floating certification card */}
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 10,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.5,
                                delay: 0.3,
                            }}
                            className="
                                absolute
                                -bottom-5
                                -right-5
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                border
                                border-white/20
                                bg-white
                                px-4
                                py-3
                                text-slate-900
                                shadow-xl
                            "
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Award size={18} />
                            </div>

                            <div>
                                <p className="text-xs font-semibold">
                                    HBT-CD Certification
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-500">
                                    Build your expertise
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom feature row */}
                <div className="mt-12 grid grid-cols-3 gap-3">
                    <Feature
                        icon={<Cpu size={15} />}
                        label="ECU"
                    />

                    <Feature
                        icon={<Gauge size={15} />}
                        label="Diagnostics"
                    />

                    <Feature
                        icon={<GraduationCap size={15} />}
                        label="Certification"
                    />
                </div>
            </div>
        </section>
    );
}

function Feature({
    icon,
    label,
}: {
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <span className="text-blue-100">
                {icon}
            </span>

            <span className="text-[10px] font-medium text-blue-100">
                {label}
            </span>
        </div>
    );
}