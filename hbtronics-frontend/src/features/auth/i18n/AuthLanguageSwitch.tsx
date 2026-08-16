import {
    type MouseEvent,
} from "react";

import {
    useAuthLanguage,
} from "../i18n/auth-language";

export function AuthLanguageSwitch() {
    const {
        language,
        setLanguage,
        t,
    } = useAuthLanguage();

    const handleSwitch = (
        event: MouseEvent<HTMLButtonElement>,
        next: "en" | "ar",
    ) => {
        event.preventDefault();
        setLanguage(next);
    };

    return (
        <div
            className="flex items-center gap-1 rounded-full border border-[#3A3A3A]/10 bg-white/80 p-1 shadow-sm backdrop-blur"
            aria-label={t.common.changeLanguage}
        >
            <button
                type="button"
                onClick={(event) =>
                    handleSwitch(event, "en")
                }
                className={[
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    language === "en"
                        ? "bg-[#3A3A3A] text-white"
                        : "text-[#3A3A3A]/60 hover:text-[#3A3A3A]",
                ].join(" ")}
            >
                EN
            </button>

            <button
                type="button"
                onClick={(event) =>
                    handleSwitch(event, "ar")
                }
                className={[
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    language === "ar"
                        ? "bg-[#3A3A3A] text-white"
                        : "text-[#3A3A3A]/60 hover:text-[#3A3A3A]",
                ].join(" ")}
            >
                العربية
            </button>
        </div>
    );
}