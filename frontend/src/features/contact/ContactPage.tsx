import {
    ArrowUpRight,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import {
    FormEvent,
    useState,
} from "react";

import { Link } from "react-router-dom";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/features/landingpage/components/FooterSection";


// ============================================================
// CONTACT INFORMATION
// ============================================================

const COMPANY = {
    name: "HBTronics",
    address:
        "03، شارع مولود فرعون، دار البيضاء، الجزائر العاصمة، الجزائر",
    phone: "+213 556 237 752",
    phoneHref: "tel:+213556237752",
    email: "support@hbtronics.dz",
    emailHref: "mailto:support@hbtronics.dz",

    mapsUrl:
        "https://www.google.com/maps?cid=18050205079933652711&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=en-US&source=embed",

    facebook:
        "https://www.facebook.com/people/HB-Tronics-Online/100089757205634/",

    linkedin:
        "https://www.linkedin.com/company/hb-tronics/",
};


// ============================================================
// FAQ
// ============================================================

const FAQS = [
    {
        question: "How can I enroll in an HBTronics course?",
        answer:
            "Browse our available courses, open the course you're interested in, and follow the enrollment process. Once enrolled, your learning progress will be available from your dashboard.",
    },
    {
        question: "Do HBTronics courses include certification?",
        answer:
            "Selected HBTronics training programs include certification pathways. Course pages provide the specific requirements, assessments, and certification information.",
    },
    {
        question: "Can I use the diagnostic simulator?",
        answer:
            "Yes. The HBTronics learning experience includes practical diagnostic scenarios designed to help you apply concepts before working on real vehicles.",
    },
    {
        question: "Can businesses train their automotive teams?",
        answer:
            "Yes. If you represent a workshop, automotive business, or training organization, contact our team and tell us what type of training you need.",
    },
    {
        question: "I have a problem with my account. Who should I contact?",
        answer:
            "For account, course, simulator, or certification issues, contact our support team using the form or the support email above.",
    },
];


// ============================================================
// INQUIRY TYPES
// ============================================================

const inquiryTypes = [
    "General inquiry",
    "Courses",
    "Certification",
    "Diagnostic simulator",
    "Technical support",
    "Business / Training",
    "Partnership",
    "Other",
];


// ============================================================
// CONTACT PAGE
// ============================================================

export function ContactPage() {
    const [openFaq, setOpenFaq] =
        useState<number | null>(0);

    const [submitted, setSubmitted] =
        useState(false);

    const [isSending, setIsSending] =
        useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        inquiry: "",
        subject: "",
        message: "",
    });


    function updateField(
        field: keyof typeof form,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }


    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setIsSending(true);

        /*
         * --------------------------------------------------------
         * Backend integration
         * --------------------------------------------------------
         *
         * Connect your Laravel contact endpoint here later.
         *
         * Example:
         *
         * await contactApi.send(form);
         *
         * --------------------------------------------------------
         */

        await new Promise((resolve) =>
            setTimeout(resolve, 700),
        );

        setIsSending(false);
        setSubmitted(true);
    }


    return (
        <div className="min-h-screen bg-white text-hbt-dark">
            <Navbar />


            {/* ====================================================
                HERO
            ===================================================== */}

            <section
                className="
                    relative
                    overflow-hidden
                    border-b
                    border-black/5
                    bg-[#F7F7F7]
                    pt-32
                    sm:pt-36
                    lg:pt-10
                "
            >
                {/* Decorative lines */}

                <div
                    className="
                        pointer-events-none
                        absolute
                        -right-24
                        top-20
                        h-80
                        w-80
                        rounded-full
                        border
                        border-hbt-orange/10
                    "
                />

                <div
                    className="
                        pointer-events-none
                        absolute
                        -right-10
                        top-34
                        h-64
                        w-64
                        rounded-full
                        border
                        border-hbt-orange/10
                    "
                />

                <div
                    className="
                        pointer-events-none
                        absolute
                        bottom-0
                        left-0
                        h-px
                        w-1/2
                        bg-gradient-to-r
                        from-transparent
                        via-hbt-orange/30
                        to-transparent
                    "
                />


                <div
                    className="
                        relative
                        mx-auto
                        max-w-8xl
                        px-5
                        pb-16
                        sm:px-8
                        sm:pb-20
                        lg:px-10
                        lg:pb-24
                    "
                >
                    <div className="max-w-3xl">

                        <div
                            className="
                                mb-6
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                border
                                border-hbt-orange/15
                                bg-white
                                px-3.5
                                py-2
                                text-xs
                                font-semibold
                                text-hbt-orange
                                shadow-sm
                            "
                        >
                            <Sparkles className="h-3.5 w-3.5" />

                            We're here to help
                        </div>


                        <h1
                            className="
                                text-4xl
                                font-bold
                                leading-[1.05]
                                tracking-[-0.04em]
                                text-hbt-dark
                                sm:text-5xl
                                lg:text-7xl
                            "
                        >
                            Let's talk about
                            <span className="block text-hbt-orange">
                                what's next.
                            </span>
                        </h1>


                        <p
                            className="
                                mt-6
                                max-w-2xl
                                text-base
                                leading-7
                                text-slate-500
                                sm:text-lg
                                sm:leading-8
                            "
                        >
                            Whether you're looking for
                            training, certification,
                            technical support, or a
                            partnership opportunity,
                            our team is ready to help.
                        </p>
                    </div>


                    {/* Quick contact */}

                    <div
                        className="
                            mt-10
                            flex
                            flex-wrap
                            gap-3
                        "
                    >
                        <a
                            href={COMPANY.emailHref}
                            className="
                                group
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-hbt-orange
                                px-5
                                py-3
                                text-sm
                                font-semibold
                                text-white
                                shadow-[0_8px_25px_rgba(244,120,34,0.20)]
                                transition-all
                                duration-300
                                hover:-translate-y-0.5
                                hover:bg-[#e96916]
                                hover:shadow-[0_12px_30px_rgba(244,120,34,0.28)]
                            "
                        >
                            Email our team

                            <ArrowUpRight
                                className="
                                    h-4
                                    w-4
                                    transition-transform
                                    duration-300
                                    group-hover:-translate-y-0.5
                                    group-hover:translate-x-0.5
                                "
                            />
                        </a>


                        <a
                            href={COMPANY.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-black/10
                                bg-white
                                px-5
                                py-3
                                text-sm
                                font-semibold
                                text-hbt-dark
                                transition-all
                                duration-300
                                hover:-translate-y-0.5
                                hover:border-black/15
                                hover:shadow-lg
                            "
                        >
                            <MapPin className="h-4 w-4 text-hbt-orange" />

                            Visit us
                        </a>
                    </div>
                </div>
            </section>


            {/* ====================================================
                CONTACT METHODS
            ===================================================== */}

            <section className="bg-white">
                <div
                    className="
                        mx-auto
                        max-w-7xl
                        px-5
                        py-12
                        sm:px-8
                        sm:py-16
                        lg:px-10
                        lg:py-20
                    "
                >
                    <div
                        className="
                            grid
                            gap-4
                            sm:grid-cols-2
                            lg:grid-cols-3
                        "
                    >

                        {/* Email */}

                        <a
                            href={COMPANY.emailHref}
                            className="
                                group
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-6
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-hbt-orange/30
                                hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-orange-50
                                    text-hbt-orange
                                    transition-transform
                                    duration-300
                                    group-hover:scale-110
                                "
                            >
                                <Mail className="h-5 w-5" />
                            </div>

                            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Email
                            </p>

                            <p className="mt-1 text-sm font-semibold text-hbt-dark">
                                {COMPANY.email}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                Send us your question
                                anytime.
                            </p>
                        </a>


                        {/* Phone */}

                        <a
                            href={COMPANY.phoneHref}
                            className="
                                group
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-6
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-hbt-orange/30
                                hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-slate-100
                                    text-hbt-dark
                                    transition-transform
                                    duration-300
                                    group-hover:scale-110
                                "
                            >
                                <Phone className="h-5 w-5" />
                            </div>

                            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Phone
                            </p>

                            <p className="mt-1 text-sm font-semibold text-hbt-dark">
                                {COMPANY.phone}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                Talk directly with our
                                team.
                            </p>
                        </a>


                        {/* Location */}

                        <a
                            href={COMPANY.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="
                                group
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-6
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-hbt-orange/30
                                hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]
                                sm:col-span-2
                                lg:col-span-1
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-slate-100
                                    text-hbt-dark
                                    transition-transform
                                    duration-300
                                    group-hover:scale-110
                                "
                            >
                                <MapPin className="h-5 w-5" />
                            </div>

                            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Visit us
                            </p>

                            <p className="mt-1 text-sm font-semibold leading-6 text-hbt-dark">
                                Dar El Beida,
                                Algiers
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                Open directions in
                                Google Maps.
                            </p>
                        </a>

                    </div>
                </div>
            </section>


            {/* ====================================================
                FORM + SIDE INFORMATION
            ===================================================== */}

            <section
                className="
                    border-y
                    border-black/5
                    bg-[#F7F7F7]
                "
            >
                <div
                    className="
                        mx-auto
                        grid
                        max-w-7xl
                        gap-10
                        px-5
                        py-16
                        sm:px-8
                        sm:py-20
                        lg:grid-cols-[0.8fr_1.2fr]
                        lg:gap-20
                        lg:px-10
                        lg:py-24
                    "
                >

                    {/* =================================================
                        LEFT
                    ================================================== */}

                    <div>
                        <p
                            className="
                                text-xs
                                font-bold
                                uppercase
                                tracking-[0.18em]
                                text-hbt-orange
                            "
                        >
                            Get in touch
                        </p>


                        <h2
                            className="
                                mt-4
                                max-w-md
                                text-3xl
                                font-bold
                                leading-tight
                                tracking-[-0.03em]
                                text-hbt-dark
                                sm:text-4xl
                            "
                        >
                            Tell us what
                            you're working on.
                        </h2>


                        <p
                            className="
                                mt-5
                                max-w-md
                                text-sm
                                leading-7
                                text-slate-500
                            "
                        >
                            Give us a little context
                            and we'll make sure your
                            message reaches the right
                            person.
                        </p>


                        <div className="mt-10 space-y-5">

                            <div className="flex gap-4">
                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-white
                                        text-hbt-orange
                                        shadow-sm
                                    "
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-hbt-dark">
                                        Need technical
                                        support?
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Tell us about
                                        your issue and
                                        we'll help you
                                        find the next
                                        step.
                                    </p>
                                </div>
                            </div>


                            <div className="flex gap-4">
                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-white
                                        text-hbt-orange
                                        shadow-sm
                                    "
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-hbt-dark">
                                        Training &
                                        certification
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Ask about
                                        courses,
                                        certification
                                        pathways, or
                                        team training.
                                    </p>
                                </div>
                            </div>


                            <div className="flex gap-4">
                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-white
                                        text-hbt-orange
                                        shadow-sm
                                    "
                                >
                                    <Clock3 className="h-4 w-4" />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-hbt-dark">
                                        We'll get back
                                        to you
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Our team will
                                        review your
                                        message and
                                        respond as soon
                                        as possible.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>


                    {/* =================================================
                        FORM
                    ================================================== */}

                    <div
                        className="
                            rounded-3xl
                            border
                            border-slate-200
                            bg-white
                            p-5
                            shadow-[0_20px_60px_rgba(15,23,42,0.06)]
                            sm:p-8
                        "
                    >
                        {submitted ? (

                            <div
                                className="
                                    flex
                                    min-h-[500px]
                                    flex-col
                                    items-center
                                    justify-center
                                    text-center
                                "
                            >
                                <div
                                    className="
                                        flex
                                        h-16
                                        w-16
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-green-50
                                        text-green-600
                                    "
                                >
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>

                                <h3
                                    className="
                                        mt-6
                                        text-2xl
                                        font-bold
                                        tracking-tight
                                        text-hbt-dark
                                    "
                                >
                                    Message received.
                                </h3>

                                <p
                                    className="
                                        mt-3
                                        max-w-sm
                                        text-sm
                                        leading-6
                                        text-slate-500
                                    "
                                >
                                    Thank you for
                                    reaching out to
                                    HBTronics. Our team
                                    will review your
                                    message and get
                                    back to you.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSubmitted(
                                            false,
                                        )
                                    }
                                    className="
                                        mt-7
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-5
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-hbt-dark
                                        transition-colors
                                        hover:bg-slate-50
                                    "
                                >
                                    Send another
                                    message
                                </button>
                            </div>

                        ) : (

                            <form
                                onSubmit={
                                    handleSubmit
                                }
                                className="space-y-5"
                            >

                                {/* Name */}

                                <div
                                    className="
                                        grid
                                        gap-5
                                        sm:grid-cols-2
                                    "
                                >
                                    <div>
                                        <label
                                            htmlFor="firstName"
                                            className="mb-2 block text-xs font-semibold text-hbt-dark"
                                        >
                                            First name
                                            <span className="text-hbt-orange">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="firstName"
                                            required
                                            value={
                                                form.firstName
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "firstName",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="Your first name"
                                            className="
                                                h-12
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-4
                                                text-sm
                                                text-hbt-dark
                                                outline-none
                                                transition-all
                                                placeholder:text-slate-400
                                                focus:border-hbt-orange
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-hbt-orange/10
                                            "
                                        />
                                    </div>


                                    <div>
                                        <label
                                            htmlFor="lastName"
                                            className="mb-2 block text-xs font-semibold text-hbt-dark"
                                        >
                                            Last name
                                        </label>

                                        <input
                                            id="lastName"
                                            value={
                                                form.lastName
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "lastName",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="Your last name"
                                            className="
                                                h-12
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-4
                                                text-sm
                                                text-hbt-dark
                                                outline-none
                                                transition-all
                                                placeholder:text-slate-400
                                                focus:border-hbt-orange
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-hbt-orange/10
                                            "
                                        />
                                    </div>
                                </div>


                                {/* Email / Phone */}

                                <div
                                    className="
                                        grid
                                        gap-5
                                        sm:grid-cols-2
                                    "
                                >
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-2 block text-xs font-semibold text-hbt-dark"
                                        >
                                            Email
                                            <span className="text-hbt-orange">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={
                                                form.email
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "email",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="you@example.com"
                                            className="
                                                h-12
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-4
                                                text-sm
                                                text-hbt-dark
                                                outline-none
                                                transition-all
                                                placeholder:text-slate-400
                                                focus:border-hbt-orange
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-hbt-orange/10
                                            "
                                        />
                                    </div>


                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="mb-2 block text-xs font-semibold text-hbt-dark"
                                        >
                                            Phone
                                        </label>

                                        <input
                                            id="phone"
                                            type="tel"
                                            value={
                                                form.phone
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "phone",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="+213 ..."
                                            className="
                                                h-12
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-4
                                                text-sm
                                                text-hbt-dark
                                                outline-none
                                                transition-all
                                                placeholder:text-slate-400
                                                focus:border-hbt-orange
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-hbt-orange/10
                                            "
                                        />
                                    </div>
                                </div>


                                {/* Inquiry */}

                                <div>
                                    <label
                                        htmlFor="inquiry"
                                        className="mb-2 block text-xs font-semibold text-hbt-dark"
                                    >
                                        What can we
                                        help with?
                                        <span className="text-hbt-orange">
                                            {" "}
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="inquiry"
                                        required
                                        value={
                                            form.inquiry
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateField(
                                                "inquiry",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="
                                            h-12
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-4
                                            text-sm
                                            text-hbt-dark
                                            outline-none
                                            transition-all
                                            focus:border-hbt-orange
                                            focus:bg-white
                                            focus:ring-4
                                            focus:ring-hbt-orange/10
                                        "
                                    >
                                        <option value="">
                                            Select an
                                            inquiry type
                                        </option>

                                        {inquiryTypes.map(
                                            (type) => (
                                                <option
                                                    key={
                                                        type
                                                    }
                                                    value={
                                                        type
                                                    }
                                                >
                                                    {type}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>


                                {/* Subject */}

                                <div>
                                    <label
                                        htmlFor="subject"
                                        className="mb-2 block text-xs font-semibold text-hbt-dark"
                                    >
                                        Subject
                                        <span className="text-hbt-orange">
                                            {" "}
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="subject"
                                        required
                                        value={
                                            form.subject
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateField(
                                                "subject",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="How can we help?"
                                        className="
                                            h-12
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-4
                                            text-sm
                                            text-hbt-dark
                                            outline-none
                                            transition-all
                                            placeholder:text-slate-400
                                            focus:border-hbt-orange
                                            focus:bg-white
                                            focus:ring-4
                                            focus:ring-hbt-orange/10
                                        "
                                    />
                                </div>


                                {/* Message */}

                                <div>
                                    <label
                                        htmlFor="message"
                                        className="mb-2 block text-xs font-semibold text-hbt-dark"
                                    >
                                        Message
                                        <span className="text-hbt-orange">
                                            {" "}
                                            *
                                        </span>
                                    </label>

                                    <textarea
                                        id="message"
                                        required
                                        rows={6}
                                        value={
                                            form.message
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateField(
                                                "message",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Tell us a little about what you need..."
                                        className="
                                            w-full
                                            resize-none
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-4
                                            py-3
                                            text-sm
                                            leading-6
                                            text-hbt-dark
                                            outline-none
                                            transition-all
                                            placeholder:text-slate-400
                                            focus:border-hbt-orange
                                            focus:bg-white
                                            focus:ring-4
                                            focus:ring-hbt-orange/10
                                        "
                                    />
                                </div>


                                {/* Submit */}

                                <button
                                    type="submit"
                                    disabled={
                                        isSending
                                    }
                                    className="
                                        group
                                        flex
                                        h-12
                                        w-full
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-hbt-orange
                                        text-sm
                                        font-semibold
                                        text-white
                                        shadow-[0_8px_25px_rgba(244,120,34,0.18)]
                                        transition-all
                                        duration-300
                                        hover:-translate-y-0.5
                                        hover:bg-[#e96916]
                                        hover:shadow-[0_12px_30px_rgba(244,120,34,0.25)]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                >
                                    {isSending ? (
                                        <>
                                            <span
                                                className="
                                                    h-4
                                                    w-4
                                                    animate-spin
                                                    rounded-full
                                                    border-2
                                                    border-white/30
                                                    border-t-white
                                                "
                                            />

                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send message

                                            <Send
                                                className="
                                                    h-4
                                                    w-4
                                                    transition-transform
                                                    duration-300
                                                    group-hover:translate-x-1
                                                "
                                            />
                                        </>
                                    )}
                                </button>


                                <p className="text-center text-[11px] leading-5 text-slate-400">
                                    By submitting this
                                    form, you agree
                                    that HBTronics
                                    may contact you
                                    regarding your
                                    inquiry.
                                </p>

                            </form>
                        )}
                    </div>

                </div>
            </section>


            {/* ====================================================
                LOCATION
            ===================================================== */}

            <section className="bg-white">
                <div
                    className="
                        mx-auto
                        max-w-7xl
                        px-5
                        py-16
                        sm:px-8
                        sm:py-20
                        lg:px-10
                        lg:py-24
                    "
                >
                    <div className="mb-10 max-w-2xl">
                        <p
                            className="
                                text-xs
                                font-bold
                                uppercase
                                tracking-[0.18em]
                                text-hbt-orange
                            "
                        >
                            Find us
                        </p>

                        <h2
                            className="
                                mt-3
                                text-3xl
                                font-bold
                                tracking-[-0.03em]
                                text-hbt-dark
                                sm:text-4xl
                            "
                        >
                            Visit HBTronics.
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-slate-500">
                            Our agency is located in
                            Dar El Beida, Algiers.
                            Come talk to us about
                            training, diagnostics,
                            certification, or your
                            next automotive project.
                        </p>
                    </div>


                    <div
                        className="
                            grid
                            overflow-hidden
                            rounded-3xl
                            border
                            border-slate-200
                            bg-[#F7F7F7]
                            lg:grid-cols-[1fr_340px]
                        "
                    >

                        {/* Map */}

                        <div className="relative min-h-[420px] bg-slate-100">

                            <iframe
                                title="HBTronics location"
                                src={`https://www.google.com/maps?q=03%20Rue%20Mouloud%20Feraoun%2C%20Dar%20El%20Beida%2C%20Algiers%2C%20Algeria&output=embed`}
                                className="
                                    absolute
                                    inset-0
                                    h-full
                                    w-full
                                    border-0
                                    grayscale-[20%]
                                "
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />

                        </div>


                        {/* Location details */}

                        <div
                            className="
                                flex
                                flex-col
                                justify-between
                                border-t
                                border-slate-200
                                bg-white
                                p-7
                                lg:border-l
                                lg:border-t-0
                            "
                        >
                            <div>

                                <div
                                    className="
                                        flex
                                        h-11
                                        w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-orange-50
                                        text-hbt-orange
                                    "
                                >
                                    <MapPin className="h-5 w-5" />
                                </div>


                                <h3 className="mt-6 text-lg font-bold text-hbt-dark">
                                    HBTronics
                                </h3>


                                <p
                                    className="
                                        mt-3
                                        text-sm
                                        leading-6
                                        text-slate-500
                                    "
                                >
                                    {COMPANY.address}
                                </p>


                                <div className="mt-7 space-y-3">

                                    <a
                                        href={
                                            COMPANY.phoneHref
                                        }
                                        className="
                                            flex
                                            items-center
                                            gap-3
                                            text-sm
                                            font-medium
                                            text-hbt-dark
                                            transition-colors
                                            hover:text-hbt-orange
                                        "
                                    >
                                        <Phone className="h-4 w-4 text-hbt-orange" />

                                        {
                                            COMPANY.phone
                                        }
                                    </a>


                                    <a
                                        href={
                                            COMPANY.emailHref
                                        }
                                        className="
                                            flex
                                            items-center
                                            gap-3
                                            text-sm
                                            font-medium
                                            text-hbt-dark
                                            transition-colors
                                            hover:text-hbt-orange
                                        "
                                    >
                                        <Mail className="h-4 w-4 text-hbt-orange" />

                                        {
                                            COMPANY.email
                                        }
                                    </a>

                                </div>

                            </div>


                            <a
                                href={
                                    COMPANY.mapsUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="
                                    group
                                    mt-8
                                    inline-flex
                                    h-11
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    text-sm
                                    font-semibold
                                    text-hbt-dark
                                    transition-all
                                    duration-300
                                    hover:border-hbt-orange/30
                                    hover:bg-orange-50
                                "
                            >
                                Get directions

                                <ArrowUpRight
                                    className="
                                        h-4
                                        w-4
                                        transition-transform
                                        duration-300
                                        group-hover:-translate-y-0.5
                                        group-hover:translate-x-0.5
                                    "
                                />
                            </a>

                        </div>
                    </div>
                </div>
            </section>


            {/* ====================================================
                FAQ
            ===================================================== */}

            <section
                className="
                    border-t
                    border-black/5
                    bg-[#F7F7F7]
                "
            >
                <div
                    className="
                        mx-auto
                        max-w-4xl
                        px-5
                        py-16
                        sm:px-8
                        sm:py-20
                        lg:py-24
                    "
                >

                    <div className="text-center">
                        <p
                            className="
                                text-xs
                                font-bold
                                uppercase
                                tracking-[0.18em]
                                text-hbt-orange
                            "
                        >
                            FAQ
                        </p>

                        <h2
                            className="
                                mt-3
                                text-3xl
                                font-bold
                                tracking-[-0.03em]
                                text-hbt-dark
                                sm:text-4xl
                            "
                        >
                            Before you reach out.
                        </h2>

                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                            A few quick answers to
                            common questions about
                            HBTronics.
                        </p>
                    </div>


                    <div className="mt-10 space-y-3">

                        {FAQS.map(
                            (
                                faq,
                                index,
                            ) => {
                                const isOpen =
                                    openFaq ===
                                    index;

                                return (
                                    <div
                                        key={
                                            faq.question
                                        }
                                        className="
                                            overflow-hidden
                                            rounded-2xl
                                            border
                                            border-slate-200
                                            bg-white
                                            transition-shadow
                                            duration-300
                                            hover:shadow-sm
                                        "
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenFaq(
                                                    isOpen
                                                        ? null
                                                        : index,
                                                )
                                            }
                                            className="
                                                flex
                                                w-full
                                                items-center
                                                justify-between
                                                gap-5
                                                px-5
                                                py-5
                                                text-left
                                            "
                                        >
                                            <span className="text-sm font-semibold text-hbt-dark">
                                                {
                                                    faq.question
                                                }
                                            </span>

                                            <ChevronDown
                                                className={[
                                                    "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300",
                                                    isOpen
                                                        ? "rotate-180 text-hbt-orange"
                                                        : "",
                                                ].join(
                                                    " ",
                                                )}
                                            />
                                        </button>


                                        <div
                                            className={[
                                                "grid transition-all duration-300 ease-out",
                                                isOpen
                                                    ? "grid-rows-[1fr] opacity-100"
                                                    : "grid-rows-[0fr] opacity-0",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                <p
                                                    className="
                                                        border-t
                                                        border-slate-100
                                                        px-5
                                                        pb-5
                                                        pt-4
                                                        text-sm
                                                        leading-6
                                                        text-slate-500
                                                    "
                                                >
                                                    {
                                                        faq.answer
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            },
                        )}

                    </div>
                </div>
            </section>


            {/* ====================================================
                FINAL CTA
            ===================================================== */}

            <section
                className="
                    relative
                    overflow-hidden
                    bg-hbt-dark
                "
            >
                <div
                    className="
                        pointer-events-none
                        absolute
                        -right-20
                        top-1/2
                        h-72
                        w-72
                        -translate-y-1/2
                        rounded-full
                        border
                        border-hbt-orange/20
                    "
                />

                <div
                    className="
                        pointer-events-none
                        absolute
                        -right-4
                        top-1/2
                        h-56
                        w-56
                        -translate-y-1/2
                        rounded-full
                        border
                        border-hbt-orange/20
                    "
                />

                <div
                    className="
                        relative
                        mx-auto
                        flex
                        max-w-7xl
                        flex-col
                        gap-8
                        px-5
                        py-16
                        sm:px-8
                        sm:py-20
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                        lg:px-10
                        lg:py-24
                    "
                >
                    <div className="max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hbt-orange">
                            Ready when you are
                        </p>

                        <h2
                            className="
                                mt-4
                                text-3xl
                                font-bold
                                leading-tight
                                tracking-[-0.03em]
                                text-white
                                sm:text-4xl
                            "
                        >
                            Your next diagnostic
                            skill starts with a
                            conversation.
                        </h2>

                        <p className="mt-4 text-sm leading-6 text-white/55">
                            Explore HBTronics training,
                            certification, and
                            practical automotive
                            learning.
                        </p>
                    </div>


                    <Link
                        to="/catalog"
                        className="
                            group
                            inline-flex
                            shrink-0
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-hbt-orange
                            px-6
                            py-3.5
                            text-sm
                            font-semibold
                            text-white
                            shadow-[0_10px_30px_rgba(244,120,34,0.25)]
                            transition-all
                            duration-300
                            hover:-translate-y-1
                            hover:bg-[#e96916]
                            hover:shadow-[0_15px_35px_rgba(244,120,34,0.35)]
                        "
                    >
                        Explore courses

                        <ArrowUpRight
                            className="
                                h-4
                                w-4
                                transition-transform
                                duration-300
                                group-hover:-translate-y-0.5
                                group-hover:translate-x-0.5
                            "
                        />
                    </Link>
                </div>
            </section>


            {/* ====================================================
                FOOTER
            ===================================================== */}

            <Footer />
        </div>
    );
}