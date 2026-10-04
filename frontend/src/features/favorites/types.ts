export type FavoriteType = "course" | "lesson" | "note";

export interface FavoriteItem {
    favorite_id?: number;
    type: FavoriteType;
    id: string;
    title: string;
    subtitle?: string | null;
    image?: string | null;
    difficulty?: string | null;
    duration_minutes?: number | null;
    is_free?: boolean;
    course_id?: string | null;
    course_title?: string | null;
    lesson_id?: string | null;
    lesson_title?: string | null;
    is_preview?: boolean;
    favorited_at?: string | null;
}

export interface FavoriteNotice {
    id: number;
    added: boolean;
    kind: FavoriteType;
    title: string;
}

export function favoriteKey(type: FavoriteType, id: string): string {
    return `${type}:${id}`;
}
