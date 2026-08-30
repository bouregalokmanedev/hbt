import {
    ArrowUpRight,
    ChevronRight,
    Mail,
} from "lucide-react";

import { Link } from "react-router-dom";


/* =============================================================
   FOOTER
============================================================= */

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden bg-[#181818] text-white">

            {/* =====================================================
                BACKGROUND GRID
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-[0.025]
                    [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
                    [background-size:80px_80px]
                "
            />


            {/* =====================================================
                TOP ORANGE LINE
            ====================================================== */}

            <div
                aria-hidden="true"
                className="
                    absolute
                    left-0
                    right-0
                    top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-hbt-orange
                    to-transparent
                    opacity-60
                "
            />


            <div
                className="
                    relative
                    mx-auto
                    w-full
                    max-w-[1600px]
                    px-5
                    sm:px-8
                    lg:px-12
                "
            >

                {/* =================================================
                    MAIN FOOTER
                ================================================== */}

                <div
                    className="
                        grid
                        gap-14
                        border-b
                        border-white/10
                        py-16
                        sm:py-20
                        lg:grid-cols-[1.4fr_1fr_1fr_1fr]
                        lg:gap-12
                    "
                >

                    {/* =================================================
                        BRAND
                    ================================================== */}

                    <div className="max-w-sm">

                        <Link
                            to="/"
                            className="
                                group
                                inline-flex
                                items-center
                            "
                        >

                            {/* =================================================
                                HBT LOGO

                                Keep this path if the logo is here:
                                /src/assets/brand/hbt-logo-full.png
                            ================================================== */}

                            <img
    src="/src/assets/brand/hbt-logo-full.png"
    alt="HBTronics"
    className="
        h-10
        w-auto
        object-contain
        object-left
        transition-opacity
        duration-300
        group-hover:opacity-50
    "
/>

                        </Link>


                        <p
                            className="
                                mt-6
                                max-w-xs
                                text-sm
                                leading-6
                                text-white/40
                            "
                        >
                            Practical automotive education
                            built for technicians who want to
                            understand the system — not just
                            memorize the answer.
                        </p>


                        {/* Platform status */}

                        <div
                            className="
                                mt-7
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                border
                                border-white/10
                                bg-white/[0.03]
                                px-3
                                py-1.5
                            "
                        >

                            <span
                                className="
                                    h-1.5
                                    w-1.5
                                    rounded-full
                                    bg-hbt-orange
                                    shadow-[0_0_8px_rgba(244,120,34,0.7)]
                                "
                            />

                            <span
                                className="
                                    font-mono
                                    text-[8px]
                                    uppercase
                                    tracking-[0.18em]
                                    text-white/40
                                "
                            >
                                Platform online
                            </span>

                        </div>

                    </div>


                    {/* =================================================
                        PLATFORM
                    ================================================== */}

                    <FooterColumn title="Platform">

                        <FooterLink
                            to="/catalog"
                            label="Courses"
                        />

                        <FooterLink
                            to="/simulator"
                            label="Diagnostic Simulator"
                        />

                        <FooterLink
                            to="/certifications"
                            label="Certifications"
                        />

                        <FooterLink
                            to="/pricing"
                            label="Pricing"
                        />

                    </FooterColumn>


                    {/* =================================================
                        COMPANY
                    ================================================== */}

                    <FooterColumn title="Company">

                        <FooterLink
                            to="/company"
                            label="About HBT"
                        />

                        <FooterLink
                            to="/contact"
                            label="Contact"
                        />

                        <FooterLink
                            to="/store"
                            label="Store"
                        />

                        <FooterLink
                            to="/faq"
                            label="FAQ"
                        />

                    </FooterColumn>


                    {/* =================================================
                        CONNECT
                    ================================================== */}

                    <FooterColumn title="Connect">

                        {/* Email */}

                        <FooterLink
                            to="/contact"
                            label="Get in touch"
                            icon={
                                <Mail className="h-3.5 w-3.5" />
                            }
                        />


                        {/* Instagram */}

                        <a
                            href="#"
                            className="
                                group
                                flex
                                items-center
                                gap-2
                                py-2
                                text-sm
                                text-white/40
                                transition-colors
                                duration-200
                                hover:text-white
                            "
                        >

                            <span
                                className="
                                    flex
                                    h-3.5
                                    w-3.5
                                    items-center
                                    justify-center
                                    rounded-[4px]
                                    border
                                    border-current
                                    text-[8px]
                                "
                            >
                                <span
                                    className="
                                        h-1.5
                                        w-1.5
                                        rounded-full
                                        border
                                        border-current
                                    "
                                />
                            </span>

                            Instagram

                            <ArrowUpRight
                                className="
                                    h-3
                                    w-3
                                    opacity-0
                                    transition-all
                                    duration-200
                                    group-hover:translate-x-0.5
                                    group-hover:-translate-y-0.5
                                    group-hover:opacity-100
                                "
                            />

                        </a>


                        {/* LinkedIn */}

                        <a
                            href="#"
                            className="
                                group
                                flex
                                items-center
                                gap-2
                                py-2
                                text-sm
                                text-white/40
                                transition-colors
                                duration-200
                                hover:text-white
                            "
                        >

                            <span
                                className="
                                    flex
                                    h-3.5
                                    w-3.5
                                    items-center
                                    justify-center
                                    rounded-[2px]
                                    bg-white/30
                                    text-[8px]
                                    font-bold
                                    text-[#181818]
                                "
                            >
                                in
                            </span>

                            LinkedIn

                            <ArrowUpRight
                                className="
                                    h-3
                                    w-3
                                    opacity-0
                                    transition-all
                                    duration-200
                                    group-hover:translate-x-0.5
                                    group-hover:-translate-y-0.5
                                    group-hover:opacity-100
                                "
                            />

                        </a>

                    </FooterColumn>

                </div>


                {/* =================================================
                    LEARNING STRIP
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        gap-6
                        border-b
                        border-white/10
                        py-8
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                    "
                >

                    <div>

                        <p
                            className="
                                text-sm
                                font-semibold
                                text-white
                            "
                        >
                            Keep learning.
                        </p>

                        <p
                            className="
                                mt-1
                                text-xs
                                text-white/35
                            "
                        >
                            New courses, diagnostics and
                            training updates.
                        </p>

                    </div>


                    <Link
                        to="/catalog"
                        className="
                            group
                            inline-flex
                            w-fit
                            items-center
                            gap-2
                            text-xs
                            font-bold
                            uppercase
                            tracking-[0.12em]
                            text-white
                            transition-colors
                            duration-300
                            hover:text-hbt-orange
                        "
                    >

                        Explore courses

                        <span
                            className="
                                flex
                                h-7
                                w-7
                                items-center
                                justify-center
                                rounded-full
                                bg-white/10
                                transition-all
                                duration-300
                                group-hover:bg-hbt-orange
                                group-hover:text-white
                            "
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </span>

                    </Link>

                </div>


                {/* =================================================
                    BOTTOM BAR
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        gap-5
                        py-7
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                    "
                >

                    {/* Copyright */}

                    <p
                        className="
                            font-mono
                            text-[8px]
                            uppercase
                            tracking-[0.15em]
                            text-white/25
                        "
                    >
                        © {year} HBTronics. All rights reserved.
                    </p>


                    {/* Legal */}

                    <div
                        className="
                            flex
                            flex-wrap
                            items-center
                            gap-x-6
                            gap-y-2
                        "
                    >

                        <Link
                            to="/privacy"
                            className="
                                text-[10px]
                                text-white/30
                                transition-colors
                                hover:text-white
                            "
                        >
                            Privacy
                        </Link>

                        <Link
                            to="/terms"
                            className="
                                text-[10px]
                                text-white/30
                                transition-colors
                                hover:text-white
                            "
                        >
                            Terms
                        </Link>

                        <Link
                            to="/cookies"
                            className="
                                text-[10px]
                                text-white/30
                                transition-colors
                                hover:text-white
                            "
                        >
                            Cookies
                        </Link>

                    </div>


                    {/* Technical status */}

                    <div
                        className="
                            hidden
                            items-center
                            gap-2
                            font-mono
                            text-[8px]
                            uppercase
                            tracking-[0.15em]
                            text-white/20
                            lg:flex
                        "
                    >

                        <span
                            className="
                                h-1.5
                                w-1.5
                                rounded-full
                                bg-hbt-orange
                            "
                        />

                        HBT / {year}

                    </div>

                </div>

            </div>

        </footer>
    );
}


/* =============================================================
   FOOTER COLUMN
============================================================= */

interface FooterColumnProps {
    title: string;
    children: React.ReactNode;
}

function FooterColumn({
    title,
    children,
}: FooterColumnProps) {
    return (
        <div>

            <h3
                className="
                    mb-5
                    font-mono
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.25em]
                    text-white/25
                "
            >
                {title}
            </h3>

            <div className="space-y-0.5">
                {children}
            </div>

        </div>
    );
}


/* =============================================================
   FOOTER LINK
============================================================= */

interface FooterLinkProps {
    to: string;
    label: string;
    icon?: React.ReactNode;
}

function FooterLink({
    to,
    label,
    icon,
}: FooterLinkProps) {
    return (
        <Link
            to={to}
            className="
                group
                flex
                items-center
                gap-2
                py-2
                text-sm
                text-white/40
                transition-colors
                duration-200
                hover:text-white
            "
        >

            {icon}

            {label}

            <ArrowUpRight
                className="
                    ml-0.5
                    h-3
                    w-3
                    opacity-0
                    transition-all
                    duration-200
                    group-hover:translate-x-0.5
                    group-hover:-translate-y-0.5
                    group-hover:opacity-100
                "
            />

        </Link>
    );
}