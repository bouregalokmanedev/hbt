import { api } from "@/lib/api/client";

import type { FavoriteItem, FavoriteType } from "../types";

export async function listFavorites(type?: FavoriteType): Promise<FavoriteItem[]> {
    const query = type ? `?type=${type}` : "";
    return api<FavoriteItem[]>(`/v1/favorites${query}`);
}

export interface ToggleFavoriteResult {
    favorited: boolean;
    type: FavoriteType;
    id: string;
}

export async function toggleFavorite(type: FavoriteType, id: string): Promise<ToggleFavoriteResult> {
    return api<ToggleFavoriteResult>("/v1/favorites/toggle", {
        method: "POST",
        body: { type, id },
    });
}

export async function favoritesStatus(items: Array<{ type: FavoriteType; id: string }>): Promise<string[]> {
    if (items.length === 0) return [];
    const result = await api<{ favorited: string[] }>("/v1/favorites/status", {
        method: "POST",
        body: { items },
    });
    return result.favorited;
}
