import { Image } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PhotoFrameProps {
    src: string | null;
    alt: string;
    className?: string;
    /** Icon-only placeholder, for small thumbnails. */
    compact?: boolean;
}

export function PhotoFrame({ src, alt, className = "", compact = false }: PhotoFrameProps) {
    const { t } = useTranslation();

    if (src) {
        return <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
    }

    return (
        <div
            role="img"
            aria-label={alt}
            data-testid="photo-placeholder"
            className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/[.05] dark:to-white/[.02] ${compact ? "gap-0" : "gap-2"} ${className}`}
        >
            <Image className={compact ? "h-4 w-4 text-slate-300 dark:text-white/25" : "h-6 w-6 text-slate-300 dark:text-white/25"} aria-hidden />
            {!compact && (
                <span className="px-3 text-center font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/35">
                    {t("companyPage.photoPlaceholder")}
                </span>
            )}
        </div>
    );
}
