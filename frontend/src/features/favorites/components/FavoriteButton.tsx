import { Heart, Loader2, Star } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authStorage } from "@/lib/storage/auth-storage";
import { cn } from "@/lib/cn";

import { useFavoritesStore } from "../store/favorites.store";
import type { FavoriteItem, FavoriteType } from "../types";

interface FavoriteButtonProps {
    type: FavoriteType;
    id: string;
    title?: string;
    meta?: Partial<FavoriteItem>;
    size?: "sm" | "md" | "lg";
    variant?: "glass" | "solid" | "ghost";
    className?: string;
}

const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
} as const;

const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-[18px] w-[18px]",
    lg: "h-5 w-5",
} as const;

export function FavoriteButton({
    type,
    id,
    title,
    meta,
    size = "md",
    variant = "glass",
    className,
}: FavoriteButtonProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isFavorite = useFavoritesStore((state) => state.isFavorite(type, id));
    const toggle = useFavoritesStore((state) => state.toggle);
    const ensureLoaded = useFavoritesStore((state) => state.ensureLoaded);
    const pending = useFavoritesStore((state) =>
        state.pendingKeys.includes(`${type}:${id}`),
    );

    useEffect(() => {
        void ensureLoaded();
    }, [ensureLoaded]);

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!authStorage.getToken()) {
            navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
            return;
        }

        void toggle(type, id, { title, ...meta });
    };

    const Icon = type === "note" ? Star : Heart;

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
            title={isFavorite ? "Remove from favourites" : "Add to favourites"}
            className={cn(
                "group/fav relative inline-flex shrink-0 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/50 focus-visible:ring-offset-2 active:scale-90 disabled:cursor-wait",
                sizes[size],
                variant === "glass" && [
                    "border backdrop-blur-md",
                    isFavorite
                        ? "border-[#F47822]/40 bg-[#F47822] text-white shadow-[0_8px_20px_rgba(244,120,34,0.4)]"
                        : "border-white/25 bg-black/30 text-white hover:border-[#F47822]/60 hover:bg-[#F47822]/90 hover:text-white",
                ],
                variant === "solid" && [
                    "border",
                    isFavorite
                        ? "border-[#F47822]/30 bg-[#F47822]/10 text-[#F47822] shadow-[0_6px_16px_rgba(244,120,34,0.18)]"
                        : "border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/40 dark:text-white/40 hover:border-[#F47822]/40 hover:text-[#F47822]",
                ],
                variant === "ghost" && [
                    "bg-transparent",
                    isFavorite ? "text-[#F47822]" : "text-[#3A3A3A]/35 dark:text-white/35 hover:text-[#F47822]",
                ],
                className,
            )}
        >
            {pending ? (
                <Loader2 className={cn(iconSizes[size], "animate-spin")} />
            ) : (
                <Icon
                    key={String(isFavorite)}
                    className={cn(
                        iconSizes[size],
                        "transition-transform duration-200 group-active/fav:scale-125",
                        isFavorite ? "animate-[fav-pop_0.35s_ease-out] fill-current" : "group-hover/fav:scale-110",
                    )}
                />
            )}
            <style>{`@keyframes fav-pop { 0% { transform: scale(0.4); } 55% { transform: scale(1.35); } 100% { transform: scale(1); } }`}</style>
        </button>
    );
}
