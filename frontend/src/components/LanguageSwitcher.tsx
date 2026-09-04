import { ChevronDown, Languages } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { changeLanguage } from "@/i18n";
import { api } from "@/lib/api/api";
import { useAuth } from "@/features/auth/hooks/useAuth";

type Language = "en" | "ar";

export function LanguageSwitcher() {
  const { user, updateUser } = useAuth();
  const { i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);

  const currentLanguage = i18n.language === "ar" ? "ar" : "en";

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function selectLanguage(language: Language) {
    changeLanguage(language);
    if (user) {
      void api<{ locale: string }>("/v1/auth/locale", {
        method: "PATCH",
        body: { locale: language },
      })
        .then(() => updateUser({ ...user, language }))
        .catch(() => undefined);
    }
    setIsOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-hbt-dark/75
                    transition-colors
                    hover:bg-hbt-gray
                    hover:text-hbt-dark
                "
      >
        <Languages className="h-4 w-4" />

        <span>{currentLanguage === "ar" ? "العربية" : "English"}</span>

        <ChevronDown
          className={[
            "h-3.5 w-3.5",
            "transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="
                        absolute
                        end-0
                        top-[calc(100%+8px)]
                        z-50
                        w-40
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-1.5
                        shadow-[0_15px_40px_rgba(15,23,42,0.12)]
                    "
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => selectLanguage("en")}
            className={[
              "flex w-full items-center",
              "rounded-lg px-3 py-2.5",
              "text-sm font-medium",
              "transition-colors",
              currentLanguage === "en"
                ? "bg-orange-50 text-hbt-orange"
                : "text-hbt-dark hover:bg-hbt-gray",
            ].join(" ")}
          >
            English
            {currentLanguage === "en" && (
              <span className="ms-auto text-xs">✓</span>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => selectLanguage("ar")}
            className={[
              "flex w-full items-center",
              "rounded-lg px-3 py-2.5",
              "text-sm font-medium",
              "transition-colors",
              currentLanguage === "ar"
                ? "bg-orange-50 text-hbt-orange"
                : "text-hbt-dark hover:bg-hbt-gray",
            ].join(" ")}
          >
            العربية
            {currentLanguage === "ar" && (
              <span className="ms-auto text-xs">✓</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
