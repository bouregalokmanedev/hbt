import { create } from "zustand";

import { authStorage } from "@/lib/storage/auth-storage";

import { listFavorites, toggleFavorite } from "../api/favorites.api";
import { favoriteKey, type FavoriteItem, type FavoriteNotice, type FavoriteType } from "../types";

interface FavoritesState {
    favorites: Record<string, FavoriteItem>;
    loaded: boolean;
    loading: boolean;
    pendingKeys: string[];
    notice: FavoriteNotice | null;

    ensureLoaded: () => Promise<void>;
    refresh: () => Promise<void>;
    isFavorite: (type: FavoriteType, id: string) => boolean;
    toggle: (type: FavoriteType, id: string, meta?: Partial<FavoriteItem>) => Promise<boolean>;
    remove: (type: FavoriteType, id: string) => Promise<void>;
    dismissNotice: () => void;
}

let noticeId = 0;

function buildNotice(added: boolean, kind: FavoriteType, title: string): FavoriteNotice {
    noticeId += 1;
    return { id: noticeId, added, kind, title };
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
    favorites: {},
    loaded: false,
    loading: false,
    pendingKeys: [],
    notice: null,

    ensureLoaded: async () => {
        if (get().loaded || get().loading) return;
        if (!authStorage.getToken()) {
            set({ loaded: true });
            return;
        }
        set({ loading: true });
        try {
            const items = await listFavorites();
            const favorites: Record<string, FavoriteItem> = {};
            for (const item of items) {
                favorites[favoriteKey(item.type, item.id)] = item;
            }
            set({ favorites, loaded: true, loading: false });
        } catch {
            set({ loaded: true, loading: false });
        }
    },

    refresh: async () => {
        if (!authStorage.getToken()) {
            set({ favorites: {}, loaded: true });
            return;
        }
        set({ loading: true });
        try {
            const items = await listFavorites();
            const favorites: Record<string, FavoriteItem> = {};
            for (const item of items) {
                favorites[favoriteKey(item.type, item.id)] = item;
            }
            set({ favorites, loaded: true, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    isFavorite: (type, id) => favoriteKey(type, id) in get().favorites,

    toggle: async (type, id, meta) => {
        const key = favoriteKey(type, id);
        const { favorites } = get();
        const currentlyFavorite = key in favorites;

        if (get().pendingKeys.includes(key)) return currentlyFavorite;

        const label =
            favorites[key]?.title ??
            meta?.title ??
            (type === "course" ? "Course" : "Lesson");

        // Optimistic update for an instant icon response.
        const optimistic: Record<string, FavoriteItem> = { ...favorites };
        if (currentlyFavorite) {
            delete optimistic[key];
        } else {
            optimistic[key] = {
                type,
                id,
                title: label,
                ...meta,
            };
        }
        set({
            favorites: optimistic,
            pendingKeys: [...get().pendingKeys, key],
            notice: null,
        });

        try {
            const result = await toggleFavorite(type, id);
            if (result.favorited) {
                const stored = get().favorites[key] ?? { type, id, title: label, ...meta };
                set({
                    favorites: { ...get().favorites, [key]: stored },
                    notice: buildNotice(true, type, stored.title),
                });
            } else {
                const next = { ...get().favorites };
                delete next[key];
                set({
                    favorites: next,
                    notice: buildNotice(false, type, label),
                });
            }
            return result.favorited;
        } catch {
            // Roll back the optimistic change.
            const rolledBack = { ...get().favorites };
            if (currentlyFavorite) {
                rolledBack[key] = favorites[key];
            } else {
                delete rolledBack[key];
            }
            set({ favorites: rolledBack });
            return currentlyFavorite;
        } finally {
            set({ pendingKeys: get().pendingKeys.filter((pending) => pending !== key) });
        }
    },

    remove: async (type, id) => {
        const key = favoriteKey(type, id);
        if (!(key in get().favorites)) return;
        await get().toggle(type, id);
    },

    dismissNotice: () => set({ notice: null }),
}));
