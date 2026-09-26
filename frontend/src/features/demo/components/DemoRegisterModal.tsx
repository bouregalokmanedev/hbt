import { X, UserPlus, Lock } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface DemoRegisterModalProps {
  open: boolean;
  onClose: () => void;
}

export function DemoRegisterModal({ open, onClose }: DemoRegisterModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-register-title"
      data-testid="demo-register-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#1b1b20]">
        <div className="h-1.5 w-full bg-[#F47822]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1.5 h-28 bg-gradient-to-b from-[#F47822]/10 to-transparent"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("demo.modal.close")}
          className="absolute end-4 top-4 rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-slate-100 hover:text-[#3A3A3A] dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative px-7 pb-7 pt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F47822] text-white shadow-[0_10px_28px_rgba(244,120,34,.35)]">
            <UserPlus className="h-8 w-8" />
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
            {t("demo.modal.eyebrow")}
          </p>
          <h2 id="demo-register-title" className="mt-2 text-xl font-bold leading-snug text-[#3A3A3A] dark:text-white">
            {t("demo.modal.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">
            {t("demo.modal.desc")}
          </p>

          <Link
            to="/register?next=%2Fdemo"
            onClick={onClose}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.25)] transition hover:bg-[#e96916]"
            data-testid="demo-register-cta"
          >
            <Lock className="h-4 w-4" />
            {t("demo.modal.cta")}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-xs font-semibold text-[#3A3A3A]/55 transition hover:text-[#F47822] dark:text-white/55"
          >
            {t("demo.modal.later")}
          </button>
        </div>
      </section>
    </div>
  );
}
