import { Award, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getCertificates } from "@/features/certificates/api/certificates.api";
import type { Certificate } from "@/features/certificates/types/certificate.types";

export function CertificatesCard() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Certificate[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCertificates()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = (items ?? []).slice(0, 3);

  return (
    <section
      data-testid="dashboard-card-certificates-content"
      className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-5 shadow-[0_10px_36px_rgba(58,58,58,0.06)] dark:border-white/10 dark:bg-[#1b1b20] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
              {t("dashboard.personalize.certificatesCard.eyebrow")}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-[#3A3A3A] dark:text-white">
              {t("dashboard.personalize.cards.certificates")}
            </h3>
          </div>
        </div>

        <Link
          to="/certificates"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#F47822] hover:underline"
        >
          {t("dashboard.personalize.viewAll")}
          <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </Link>
      </div>

      {items === null ? (
        <div className="mt-5 flex items-center gap-2 py-4 text-xs text-[#3A3A3A]/45 dark:text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("certificates.loading")}
        </div>
      ) : top.length === 0 ? (
        <p className="mt-5 text-sm text-[#3A3A3A]/50 dark:text-white/50">
          {t("dashboard.personalize.certificatesCard.empty")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {top.map((certificate) => (
            <li
              key={certificate.id}
              className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2.5 dark:border-white/8 dark:bg-white/[0.04]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F47822]/10 text-[#F47822]">
                <Award className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-white/90">
                  {certificate.course_title}
                </span>
                <span
                  className="block text-[11px] text-[#3A3A3A]/45 dark:text-white/45"
                  dir="ltr"
                >
                  {certificate.certificate_number}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
