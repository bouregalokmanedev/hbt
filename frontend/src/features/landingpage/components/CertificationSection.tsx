import {
    ArrowRight,
    Award,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

export function CertificationSection() {
    return (
        <section className="relative overflow-hidden bg-white text-[#171717]">
            {/* =========================================================
                BACKGROUND GRID
            ========================================================== */}

            <div
                className="
                    pointer-events-none
                    absolute inset-0
                    opacity-[0.045]
                    [background-image:linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]
                    [background-size:64px_64px]
                "
            />

            {/* Large decorative mark */}
            <div
                className="
                    pointer-events-none
                    absolute
                    -right-20
                    top-32
                    select-none
                    text-[18rem]
                    font-black
                    leading-none
                    tracking-[-0.08em]
                    text-[#171717]/[0.025]
                "
            >
                HBT
            </div>

            <div className="relative mx-auto max-w-[1400px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
                {/* =====================================================
                    TOP LABEL
                ====================================================== */}

                <div className="flex items-center justify-between border-b border-[#171717]/10 pb-5">
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-[#F47822]" />

                        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#171717]/60">
                            HBT Certification
                        </span>
                    </div>

                    <span className="hidden text-[10px] font-bold tracking-[0.2em] text-[#171717]/30 sm:block">
                        05 / 05
                    </span>
                </div>

                {/* =====================================================
                    HERO COPY
                ====================================================== */}

                <div className="grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-24">
                    <div>
                        <p className="mb-6 text-xs font-bold uppercase tracking-[0.28em] text-[#F47822]">
                            Learn. Prove. Get certified.
                        </p>

                        <h2
                            className="
                                max-w-5xl
                                text-6xl
                                font-black
                                uppercase
                                leading-[0.84]
                                tracking-[-0.055em]
                                text-[#171717]
                                sm:text-7xl
                                lg:text-[8.5rem]
                            "
                        >
                            Your skills.
                            <br />

                            <span className="text-[#F47822]">
                                Your proof.
                            </span>
                        </h2>
                    </div>

                    <div className="max-w-md lg:pb-3">
                        <div className="border-l-2 border-[#F47822] pl-6">
                            <p className="text-base leading-7 text-[#171717]/65 sm:text-lg">
                                Turn your learning into a verified
                                professional credential. Complete the
                                required training, demonstrate your
                                knowledge, and earn an HBT certification
                                that represents what you can actually do.
                            </p>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CERTIFICATION PREVIEW
                ====================================================== */}

                <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                    {/* Certificate */}
                    <div className="relative overflow-hidden border border-[#171717]/15 bg-[#F7F7F7]">
                        {/* Orange top line */}
                        <div className="h-1.5 bg-[#F47822]" />

                        <div className="relative p-6 sm:p-10 lg:p-12">
                            {/* Decorative circles */}
                            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[#F47822]/10" />

                            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-[#F47822]/10" />

                            <div className="relative">
                                {/* Certificate header */}
                                <div className="flex items-start justify-between gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#F47822]">
                                            HBTronics
                                        </p>

                                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[#171717]/40">
                                            Professional Certification
                                        </p>
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F47822]/30 bg-white">
                                        <Award className="h-6 w-6 text-[#F47822]" />
                                    </div>
                                </div>

                                {/* Certificate title */}
                                <div className="mt-16 max-w-2xl">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#171717]/40">
                                        This certifies that
                                    </p>

                                    <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#171717] sm:text-4xl">
                                        Certified Diagnostic
                                        <br />
                                        Technician
                                    </h3>

                                    <p className="mt-5 max-w-xl text-sm leading-6 text-[#171717]/55">
                                        Has successfully completed the
                                        required HBT learning path and
                                        demonstrated the knowledge and
                                        diagnostic reasoning required for
                                        this certification level.
                                    </p>
                                </div>

                                {/* Credential details */}
                                <div className="mt-14 grid gap-4 border-t border-[#171717]/10 pt-6 sm:grid-cols-3">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#171717]/35">
                                            Certification
                                        </p>

                                        <p className="mt-1 text-sm font-bold">
                                            HBT-CD Level 01
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#171717]/35">
                                            Status
                                        </p>

                                        <div className="mt-1 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />

                                            <span className="text-sm font-bold text-emerald-600">
                                                Verified
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#171717]/35">
                                            Credential
                                        </p>

                                        <p className="mt-1 text-sm font-bold">
                                            HBT-••••-2048
                                        </p>
                                    </div>
                                </div>

                                {/* Signature / verification */}
                                <div className="mt-8 flex flex-col gap-5 border-t border-[#171717]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#171717]/35">
                                            Issued by
                                        </p>

                                        <p className="mt-1 text-sm font-bold">
                                            HBTronics Learning Platform
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#171717]/50">
                                        <ShieldCheck className="h-4 w-4 text-[#F47822]" />
                                        Digitally verifiable credential
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right information panel */}
                    <div className="flex flex-col border border-[#171717]/10 bg-[#171717] text-white">
                        <div className="flex-1 p-7 sm:p-9">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F47822]">
                                    <ShieldCheck className="h-5 w-5 text-white" />
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                                        Verified credential
                                    </p>

                                    <p className="mt-1 text-sm font-semibold">
                                        Built around demonstrated skills
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 space-y-0">
                                {[
                                    "Complete the required course",
                                    "Pass the required quizzes",
                                    "Complete diagnostic scenarios",
                                    "Meet the certification score",
                                    "Receive your verified credential",
                                ].map((item, index) => (
                                    <div
                                        key={item}
                                        className="flex gap-4 border-t border-white/10 py-4"
                                    >
                                        <span className="text-[10px] font-bold text-[#F47822]">
                                            0{index + 1}
                                        </span>

                                        <span className="text-sm leading-5 text-white/70">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-white/10 p-7 sm:p-9">
                            <p className="text-xs leading-6 text-white/45">
                                Your certification is connected to your
                                learning record, making your achievement
                                traceable and easier to validate.
                            </p>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    WHAT CERTIFICATION MEANS
                ====================================================== */}

                <div className="mt-20 border-y border-[#171717]/10">
                    <div className="grid md:grid-cols-3">
                        <CertificationFeature
                            number="01"
                            title="Prove knowledge"
                            description="Demonstrate that you understand the concepts covered by the certification path."
                        />

                        <CertificationFeature
                            number="02"
                            title="Prove reasoning"
                            description="Use diagnostic scenarios and practical decisions to show how you apply what you learned."
                        />

                        <CertificationFeature
                            number="03"
                            title="Build credibility"
                            description="Earn a professional credential that represents completed training and verified achievement."
                        />
                    </div>
                </div>

                {/* =====================================================
                    CERTIFICATION LEVELS
                ====================================================== */}

                <div className="mt-20 grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F47822]">
                            Certification paths
                        </p>

                        <h3 className="mt-4 max-w-lg text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-5xl">
                            Keep learning.
                            <br />
                            Keep leveling up.
                        </h3>

                        <p className="mt-5 max-w-md text-sm leading-6 text-[#171717]/55">
                            Certifications can form a progression from
                            foundational knowledge to advanced diagnostic
                            capability.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <CertificationLevel
                            level="01"
                            title="Foundations"
                            description="Core concepts, systems, tools and diagnostic fundamentals."
                            active
                        />

                        <CertificationLevel
                            level="02"
                            title="Advanced Diagnostics"
                            description="Deeper diagnostic reasoning, testing strategies and real-world scenarios."
                        />

                        <CertificationLevel
                            level="03"
                            title="Professional Mastery"
                            description="Advanced troubleshooting, complex cases and expert-level decision making."
                        />
                    </div>
                </div>

                {/* =====================================================
                    CTA
                ====================================================== */}

                <div className="mt-24 flex flex-col gap-7 border-t border-[#171717]/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#F47822]" />

                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.12em]">
                                Ready to earn yours?
                            </p>

                            <p className="mt-1 text-sm text-[#171717]/50">
                                Start learning and work toward your first
                                HBT certification.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/courses"
                        className="
                            group
                            inline-flex
                            shrink-0
                            items-center
                            justify-center
                            gap-3
                            bg-[#F47822]
                            px-7
                            py-4
                            text-xs
                            font-bold
                            uppercase
                            tracking-[0.16em]
                            text-white
                            transition-all
                            duration-300
                            hover:bg-[#df6819]
                        "
                    >
                        Explore certification paths

                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* =============================================================
   FEATURE
============================================================= */

interface CertificationFeatureProps {
    number: string;
    title: string;
    description: string;
}

function CertificationFeature({
    number,
    title,
    description,
}: CertificationFeatureProps) {
    return (
        <div className="border-b border-[#171717]/10 p-7 last:border-b-0 md:border-b-0 md:border-r md:p-8 md:last:border-r-0 lg:p-10">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#F47822]">
                {number}
            </span>

            <h4 className="mt-10 text-xl font-black uppercase tracking-tight">
                {title}
            </h4>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[#171717]/50">
                {description}
            </p>
        </div>
    );
}

/* =============================================================
   CERTIFICATION LEVEL
============================================================= */

interface CertificationLevelProps {
    level: string;
    title: string;
    description: string;
    active?: boolean;
}

function CertificationLevel({
    level,
    title,
    description,
    active = false,
}: CertificationLevelProps) {
    return (
        <div
            className={`
                group
                flex
                items-center
                gap-5
                border
                p-5
                transition-all
                duration-300
                sm:p-6
                ${
                    active
                        ? "border-[#F47822] bg-[#F47822]/[0.035]"
                        : "border-[#171717]/10 hover:border-[#F47822]/40"
                }
            `}
        >
            <div
                className={`
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    text-xs
                    font-black
                    ${
                        active
                            ? "bg-[#F47822] text-white"
                            : "bg-[#171717]/5 text-[#171717]/50"
                    }
                `}
            >
                {level}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-sm font-black uppercase tracking-wide">
                        {title}
                    </h4>

                    {active && (
                        <span className="rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#F47822]">
                            Available
                        </span>
                    )}
                </div>

                <p className="mt-1 text-xs leading-5 text-[#171717]/45">
                    {description}
                </p>
            </div>

            <ArrowRight
                className={`
                    hidden
                    h-4
                    w-4
                    shrink-0
                    transition-transform
                    duration-300
                    sm:block
                    ${
                        active
                            ? "text-[#F47822] group-hover:translate-x-1"
                            : "text-[#171717]/20"
                    }
                `}
            />
        </div>
    );
}