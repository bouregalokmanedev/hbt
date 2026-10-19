import type { ReactNode } from "react";

import { CalendarClock, CreditCard, Receipt, ShieldCheck, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

/* =====================================================
   PAYMENT METHODS — pricing page section
   Tabby & Tamara use the official badges vendored from
   the brands' merchant kits (public/assets/payments/);
   Visa & Mastercard marks are drawn in markup.
===================================================== */

type Method = {
  id: string;
  name: string;
  description: string;
  chip?: string;
  plate: ReactNode;
};

type GroupCardProps = {
  Icon: typeof CreditCard;
  label: string;
  note: string;
  items: Method[];
};

function MethodCard({ name, description, chip, plate }: Method) {
  return (
    <article
      className="
        group
        relative
        flex
        flex-col
        items-center
        gap-3
        rounded-2xl
        border
        border-slate-200
        bg-slate-50/70
        p-5
        text-center
        transition-all
        duration-300
        hover:-translate-y-1.5
        hover:border-hbt-orange/40
        hover:bg-white
        hover:shadow-lg
        dark:border-white/10
        dark:bg-white/4
        dark:hover:border-hbt-orange/40
        dark:hover:bg-white/8
      "
    >
      {chip && (
        <span
          className="
                        absolute
                        -top-2.5
                        left-1/2
                        -translate-x-1/2
                        whitespace-nowrap
                        rounded-full
                        bg-hbt-orange
                        px-3
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-white
                        shadow-md
                    "
        >
          {chip}
        </span>
      )}

      <span
        className="
                            flex
                            h-14
                            w-24
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-xl
                            bg-white
                            shadow-sm
                            ring-1
                            ring-slate-200/80
                            transition-transform
                            duration-300
                            group-hover:scale-105
                            dark:bg-white
                            dark:ring-white/10
                        "
      >
        {plate}
      </span>

      <div>
        <p className="text-sm font-bold text-hbt-dark dark:text-[#ececef]">
          {name}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
          {description}
        </p>
      </div>
    </article>
  );
}

function GroupCard({ Icon, label, note, items }: GroupCardProps) {
  return (
    <div
      className="
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                    sm:p-7
                    dark:border-white/10
                    dark:bg-[#1b1b20]
                "
    >
      <div className="flex items-center gap-3">
        <span
          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-xl
                            bg-orange-50
                            text-hbt-orange
                            dark:bg-hbt-orange/10
                        "
        >
          <Icon className="h-5 w-5" />
        </span>

        <p
          className="
                            text-[11px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-400
                            dark:text-white/40
                        "
        >
          {label}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <MethodCard key={item.id} {...item} />
        ))}
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-white/50">
        {note}
      </p>
    </div>
  );
}

export function PaymentMethodsSection() {
  const { t } = useTranslation();

  const bnplMethods: Method[] = [
    {
      id: "tabby",
      name: t("pricing.payment.tabby.name"),
      description: t("pricing.payment.tabby.description"),
      chip: t("pricing.payment.tabby.chip"),
      plate: (
        <img
          src="/assets/payments/tabby-badge.svg"
          alt="Tabby"
          className="h-7 w-auto"
        />
      ),
    },
    {
      id: "tamara",
      name: t("pricing.payment.tamara.name"),
      description: t("pricing.payment.tamara.description"),
      chip: t("pricing.payment.tamara.chip"),
      plate: (
        <img
          src="/assets/payments/tamara-logo-badge.png"
          alt="Tamara"
          className="h-7 w-auto"
        />
      ),
    },
  ];

  const cardMethods: Method[] = [
    {
      id: "visa",
      name: t("pricing.payment.visa.name"),
      description: t("pricing.payment.visa.description"),
      plate: (
        <span className="text-xl font-black italic tracking-tight text-[#1A1F71]">
          VISA
        </span>
      ),
    },
    {
      id: "mastercard",
      name: t("pricing.payment.mastercard.name"),
      description: t("pricing.payment.mastercard.description"),
      plate: (
        <span className="relative inline-block h-7 w-11">
          <span className="absolute left-0 top-0 h-7 w-7 rounded-full bg-[#EB001B]" />
          <span className="absolute right-0 top-0 h-7 w-7 rounded-full bg-[#F79E1B] opacity-90 mix-blend-multiply" />
        </span>
      ),
    },
  ];

  const trustItems = [
    { id: "secure", Icon: ShieldCheck, label: t("pricing.payment.trust.secure") },
    { id: "instant", Icon: Zap, label: t("pricing.payment.trust.instant") },
    { id: "fees", Icon: Receipt, label: t("pricing.payment.trust.noFees") },
  ];

  return (
    <section
      aria-labelledby="payment-methods-title"
      className="relative isolate overflow-hidden"
    >
      {/* Orange glow */}
      <div
        aria-hidden="true"
        className="
                        pointer-events-none
                        absolute
                        left-1/2
                        top-10
                        -z-10
                        h-[320px]
                        w-[640px]
                        -translate-x-1/2
                        rounded-full
                        bg-hbt-orange/10
                        blur-[120px]
                    "
      />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mx-auto max-w-2xl text-center">
          <div
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-full
                            border border-hbt-orange/20
                            bg-orange-50
                            px-3.5
                            py-1.5
                            text-xs
                            font-semibold
                            text-hbt-orange
                            dark:border-hbt-orange/30
                            dark:bg-hbt-orange/10
                        "
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("pricing.payment.badge")}
          </div>

          <h2
            id="payment-methods-title"
            className="
                            mt-5
                            text-3xl
                            font-bold
                            tracking-tight
                            text-hbt-dark dark:text-[#ececef]
                            sm:text-4xl
                        "
          >
            {t("pricing.payment.title")}
          </h2>

          <p
            className="
                            mt-4
                            text-sm
                            leading-6
                            text-slate-500 dark:text-white/55
                            sm:text-base
                        "
          >
            {t("pricing.payment.subtitle")}
          </p>
        </div>

        {/* =================================================
            METHOD GROUPS
        ================================================== */}

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <GroupCard
            Icon={CalendarClock}
            label={t("pricing.payment.bnpl")}
            note={t("pricing.payment.bnplNote")}
            items={bnplMethods}
          />

          <GroupCard
            Icon={CreditCard}
            label={t("pricing.payment.cards")}
            note={t("pricing.payment.cardsNote")}
            items={cardMethods}
          />
        </div>

        {/* =================================================
            TRUST ROW
        ================================================== */}

        <ul
          className="
                        mt-10
                        flex
                        flex-wrap
                        items-center
                        justify-center
                        gap-x-8
                        gap-y-3
                    "
        >
          {trustItems.map(({ id, Icon, label }) => (
            <li
              key={id}
              className="
                                flex
                                items-center
                                gap-2
                                text-sm
                                font-medium
                                text-slate-600
                                dark:text-white/65
                            "
            >
              <Icon className="h-4 w-4 shrink-0 text-hbt-orange" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
