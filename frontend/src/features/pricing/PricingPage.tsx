import { ArrowRight, Check, HelpCircle, Sparkles } from "lucide-react";

import { useMemo, useState } from "react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type BillingPeriod = "monthly" | "yearly";

interface PricingPlan {
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  popular?: boolean;
  features: string[];
  cta: string;
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    description:
      "Everything you need to start building stronger diagnostic skills.",
    monthly: 0,
    yearly: 0,
    features: [
      "Access to free courses",
      "Course previews",
      "Basic learning progress",
      "Learning resources",
      "Community access",
    ],
    cta: "Start learning",
  },

  {
    name: "Professional",
    description:
      "For technicians who want structured training and practical experience.",
    monthly: 19,
    yearly: 190,
    popular: true,
    features: [
      "Full course library",
      "Diagnostic scenarios",
      "Practical simulations",
      //  "Progress tracking",
      "Certificates",
      // "Advanced learning resources",
      "Priority support",
    ],
    cta: "Start learning",
  },

  {
    name: "Academy",
    description:
      "Advanced training for teams, workshops and professional development.",
    monthly: 49,
    yearly: 490,
    features: [
      "Everything in Professional",
      "Advanced diagnostic training",
      "Team learning",
      "Performance analytics",
      //  "Team management",
      "Priority technical support",
      // "Professional resources",
    ],
    cta: "Contact us",
  },
];

const faqs = [
  {
    question: "Can I start learning for free?",
    answer:
      "Yes. HBTronics offers free learning content so you can explore the platform before choosing a paid plan.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes. You can cancel your subscription at any time. Your access remains available until the end of your current billing period.",
  },
  {
    question: "Do courses include certificates?",
    answer:
      "Eligible courses include certificates after completing the required learning activities and assessments.",
  },
  {
    question: "Are the simulations included?",
    answer:
      "Practical diagnostic simulations are included with Professional and Academy plans.",
  },
];

function formatPrice(price: number): string {
  if (price === 0) {
    return "Free";
  }

  return `$${price}`;
}

export function PricingPage() {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const yearlySavings = useMemo(() => {
    return plans.map((plan) => ({
      name: plan.name,
      saving: plan.monthly > 0 ? plan.monthly * 12 - plan.yearly : 0,
    }));
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* =====================================================
                HERO
            ====================================================== */}

      <section className="relative isolate border-b border-border/60">
        {/* Background grid */}

        <div
          aria-hidden="true"
          className="
                        pointer-events-none
                        absolute
                        inset-0
                        -z-10
                        opacity-[0.45]
                        [background-image:linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)]
                        [background-size:48px_48px]
                    "
        />

        {/* Orange glow */}

        <div
          aria-hidden="true"
          className="
                        pointer-events-none
                        absolute
                        left-1/2
                        top-0
                        -z-10
                        h-[420px]
                        w-[700px]
                        -translate-x-1/2
                        rounded-full
                        bg-hbt-orange/10
                        blur-[120px]
                    "
        />

        <div className="mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div
              className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                border
                                border-hbt-orange/20
                                bg-orange-50
                                px-3.5
                                py-1.5
                                text-xs
                                font-semibold
                                text-hbt-orange
                            "
            >
              <Sparkles className="h-3.5 w-3.5" />

              {t("pricing.hero.badge")}
            </div>

            <h1
              className="
                                mt-6
                                text-4xl
                                font-bold
                                tracking-[-0.045em]
                                text-hbt-dark
                                sm:text-5xl
                                lg:text-6xl
                            "
            >
              {t("pricing.hero.title")}
            </h1>

            <p
              className="
                                mx-auto
                                mt-5
                                max-w-2xl
                                text-base
                                leading-7
                                text-slate-500
                                sm:text-lg
                                sm:leading-8
                            "
            >
              {t("pricing.hero.description")}
            </p>
          </div>

          {/* Billing toggle */}

          <div className="mt-10 flex justify-center">
            <div
              className="
                                inline-flex
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-1
                                shadow-sm
                            "
            >
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={[
                  "rounded-xl px-5 py-2.5",
                  "text-sm font-semibold",
                  "transition-all duration-200",
                  billing === "monthly"
                    ? "bg-hbt-dark text-white shadow-sm"
                    : "text-slate-500 hover:text-hbt-dark",
                ].join(" ")}
              >
                {t("pricing.billing.monthly")}
              </button>

              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={[
                  "flex items-center gap-2 rounded-xl px-5 py-2.5",
                  "text-sm font-semibold",
                  "transition-all duration-200",
                  billing === "yearly"
                    ? "bg-hbt-dark text-white shadow-sm"
                    : "text-slate-500 hover:text-hbt-dark",
                ].join(" ")}
              >
                {t("pricing.billing.yearly")}

                <span
                  className="
                                        rounded-full
                                        bg-orange-100
                                        px-2
                                        py-0.5
                                        text-[10px]
                                        font-bold
                                        text-hbt-orange
                                    "
                >
                  {t("pricing.billing.save")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
                PRICING CARDS
            ====================================================== */}

      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const price = billing === "monthly" ? plan.monthly : plan.yearly;

              const monthlyEquivalent =
                billing === "yearly" && plan.yearly > 0
                  ? plan.yearly / 12
                  : plan.monthly;

              const saving = yearlySavings[index]?.saving ?? 0;

              return (
                <article
                  key={plan.name}
                  className={[
                    "group relative flex flex-col",
                    "rounded-3xl",
                    "border",
                    "p-7 sm:p-8",
                    "transition-all duration-500",
                    "hover:-translate-y-2",
                    plan.popular
                      ? [
                          "border-hbt-orange/40",
                          "bg-hbt-dark",
                          "text-white",
                          "shadow-[0_30px_80px_rgba(244,120,34,0.16)]",
                        ].join(" ")
                      : [
                          "border-slate-200",
                          "bg-white",
                          "shadow-sm",
                          "hover:border-hbt-orange/30",
                          "hover:shadow-xl",
                        ].join(" "),
                  ].join(" ")}
                >
                  {/* Popular badge */}

                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className="
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                        rounded-full
                                                        bg-hbt-orange
                                                        px-4
                                                        py-1.5
                                                        text-[11px]
                                                        font-bold
                                                        uppercase
                                                        tracking-wide
                                                        text-white
                                                        shadow-lg
                                                    "
                      >
                        <Sparkles className="h-3 w-3" />

                        {t("pricing.plans.mostPopular")}
                      </span>
                    </div>
                  )}

                  {/* Number */}

                  <div
                    className={[
                      "mb-7 flex items-center justify-between",
                      plan.popular ? "text-white" : "text-hbt-dark",
                    ].join(" ")}
                  >
                    <span
                      className="
                                                    flex
                                                    h-9
                                                    w-9
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    bg-hbt-orange
                                                    text-xs
                                                    font-bold
                                                    text-white
                                                "
                    >
                      0{index + 1}
                    </span>

                    {billing === "yearly" && saving > 0 && (
                      <span
                        className={[
                          "text-xs font-semibold",
                          plan.popular ? "text-orange-300" : "text-hbt-orange",
                        ].join(" ")}
                      >
                        Save ${saving}
                      </span>
                    )}
                  </div>

                  {/* Name */}

                  <h2
                    className={[
                      "text-2xl font-bold tracking-tight",
                      plan.popular ? "text-white" : "text-hbt-dark",
                    ].join(" ")}
                  >
                    {t(`pricing.plans.${plan.name.toLowerCase()}`)}
                  </h2>

                  {/* Description */}

                  <p
                    className={[
                      "mt-3 min-h-[72px] text-sm leading-6",
                      plan.popular ? "text-white/60" : "text-slate-500",
                    ].join(" ")}
                  >
                    {t(`pricing.plans.${plan.name.toLowerCase()}Description`)}
                  </p>

                  {/* Price */}

                  <div className="mt-7">
                    <div className="flex items-end gap-1">
                      <span
                        className={[
                          "text-4xl font-bold tracking-tight",
                          plan.popular ? "text-white" : "text-hbt-dark",
                        ].join(" ")}
                      >
                        {formatPrice(price)}
                      </span>

                      {price > 0 && (
                        <span
                          className={[
                            "mb-1.5 text-sm",
                            plan.popular ? "text-white/50" : "text-slate-400",
                          ].join(" ")}
                        >
                          /{billing === "monthly" ? "month" : "year"}
                        </span>
                      )}
                    </div>

                    {billing === "yearly" && plan.yearly > 0 && (
                      <p
                        className={[
                          "mt-2 text-xs",
                          plan.popular ? "text-white/40" : "text-slate-400",
                        ].join(" ")}
                      >
                        ${monthlyEquivalent.toFixed(2)}
                        /month billed yearly
                      </p>
                    )}
                  </div>

                  {/* CTA */}

                  <Link
                    to={plan.name === "Academy" ? "/contact" : "/register"}
                    className={[
                      "mt-8 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5",
                      "text-sm font-semibold",
                      "transition-all duration-300",
                      "group-hover:shadow-lg",
                      plan.popular
                        ? [
                            "bg-hbt-orange",
                            "text-white",
                            "hover:bg-[#e96916]",
                            "hover:-translate-y-0.5",
                          ].join(" ")
                        : [
                            "border border-slate-200",
                            "bg-white",
                            "text-hbt-dark",
                            "hover:border-hbt-orange",
                            "hover:text-hbt-orange",
                          ].join(" "),
                    ].join(" ")}
                  >
                    {plan.name === "Academy"
                      ? t("pricing.plans.contactUs")
                      : t("pricing.plans.startLearning")}

                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>

                  {/* Divider */}

                  <div
                    className={[
                      "my-8 h-px",
                      plan.popular ? "bg-white/10" : "bg-slate-100",
                    ].join(" ")}
                  />

                  {/* Features */}

                  <div className="flex-1">
                    <p
                      className={[
                        "mb-4 text-xs font-bold uppercase tracking-wider",
                        plan.popular ? "text-white/40" : "text-slate-400",
                      ].join(" ")}
                    >
                      {t("pricing.plans.included")}
                    </p>

                    <ul className="space-y-3.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                              plan.popular
                                ? "bg-hbt-orange/20 text-orange-300"
                                : "bg-orange-50 text-hbt-orange",
                            ].join(" ")}
                          >
                            <Check className="h-3 w-3" />
                          </span>

                          <span
                            className={[
                              "text-sm leading-5",
                              plan.popular ? "text-white/75" : "text-slate-600",
                            ].join(" ")}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
                TRUST STRIP
            ====================================================== */}

      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-hbt-dark">
                {t("pricing.trust.practical")}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {t("pricing.trust.practicalDescription")}
              </p>
            </div>

            <div className="sm:border-x sm:border-slate-200">
              <p className="text-2xl font-bold text-hbt-dark">
                {t("pricing.trust.flexible")}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {t("pricing.trust.flexibleDescription")}
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-hbt-dark">
                {t("pricing.trust.career")}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {t("pricing.trust.careerDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
                FAQ
            ====================================================== */}

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="text-center">
          <div
            className="
                            mx-auto
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-2xl
                            bg-orange-50
                            text-hbt-orange
                        "
          >
            <HelpCircle className="h-5 w-5" />
          </div>

          <h2
            className="
                            mt-5
                            text-3xl
                            font-bold
                            tracking-tight
                            text-hbt-dark
                            sm:text-4xl
                        "
          >
            {t("pricing.faq.title")}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            {t("pricing.faq.subtitle")}
          </p>
        </div>

        <div className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary
                className="
                                        flex
                                        cursor-pointer
                                        list-none
                                        items-center
                                        justify-between
                                        gap-6
                                        text-sm
                                        font-semibold
                                        text-hbt-dark
                                    "
              >
                {faq.question}

                <span
                  className="
                                            flex
                                            h-7
                                            w-7
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-slate-100
                                            text-slate-500
                                            transition-transform
                                            duration-300
                                            group-open:rotate-45
                                        "
                >
                  +
                </span>
              </summary>

              <p
                className="
                                        mt-3
                                        max-w-2xl
                                        text-sm
                                        leading-6
                                        text-slate-500
                                    "
              >
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* =====================================================
                FINAL CTA
            ====================================================== */}

      <section className="px-5 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div
          className="
                        relative
                        mx-auto
                        max-w-6xl
                        overflow-hidden
                        rounded-[2rem]
                        bg-hbt-dark
                        px-6
                        py-14
                        text-center
                        shadow-[0_30px_80px_rgba(15,23,42,0.18)]
                        sm:px-12
                        sm:py-16
                    "
        >
          {/* Decorative lines */}

          <div
            aria-hidden="true"
            className="
                            pointer-events-none
                            absolute
                            -left-20
                            top-1/2
                            h-40
                            w-[500px]
                            -translate-y-1/2
                            rotate-[-15deg]
                            rounded-full
                            border
                            border-hbt-orange/20
                        "
          />

          <div
            aria-hidden="true"
            className="
                            pointer-events-none
                            absolute
                            -right-20
                            top-1/2
                            h-40
                            w-[500px]
                            -translate-y-1/2
                            rotate-[15deg]
                            rounded-full
                            border
                            border-white/10
                        "
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-hbt-orange">
              Ready to begin?
            </p>

            <h2
              className="
                                mx-auto
                                mt-4
                                max-w-2xl
                                text-3xl
                                font-bold
                                tracking-tight
                                text-white
                                sm:text-4xl
                            "
            >
              Your next diagnostic skill starts here.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              Join HBTronics and build practical automotive diagnostic skills
              through structured learning.
            </p>

            <Link
              to="/register"
              className="
                                group
                                mt-8
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-hbt-orange
                                px-6
                                py-3.5
                                text-sm
                                font-bold
                                text-white
                                shadow-lg
                                shadow-orange-500/20
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:bg-[#e96916]
                                hover:shadow-xl
                            "
            >
              Start learning
              <ArrowRight
                className="
                                    h-4
                                    w-4
                                    transition-transform
                                    duration-300
                                    group-hover:translate-x-1
                                "
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
