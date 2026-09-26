import { useState } from "react";

import type { User } from "@/features/auth/types/auth.types";

type AvatarUser =
    | Pick<
          User,
          "avatar" | "first_name" | "last_name"
      >
    | null
    | undefined;

interface UserAvatarProps {
    user?: AvatarUser;
    className?: string;
    fallbackClassName?: string;
    roundedClassName?: string;
}

/*
 * Every avatar in the app uses the same squared shape: the profile page
 * picture is a 96px box with a 16px radius (rounded-2xl), so 16/96 keeps the
 * exact same geometry at any size instead of turning small ones into circles.
 * Exported so initials-only avatars outside UserAvatar match exactly.
 */
export const AVATAR_SQUARE_SHAPE = "rounded-[16.667%]";

export function UserAvatar({
    user,
    className = "h-9 w-9",
    fallbackClassName = "bg-hbt-orange text-xs font-semibold text-white",
    roundedClassName = AVATAR_SQUARE_SHAPE,
}: UserAvatarProps) {
    const [failed, setFailed] = useState(false);

    const initials =
        `${
            user?.first_name?.[0] ?? ""
        }${user?.last_name?.[0] ?? ""}`.toUpperCase() ||
        "U";

    if (user?.avatar && !failed) {
        return (
            <img
                src={user.avatar}
                alt=""
                aria-hidden
                onError={() => setFailed(true)}
                className={`${className} aspect-square shrink-0 ${roundedClassName} object-cover`}
            />
        );
    }

    return (
        <div
            className={`${className} flex aspect-square shrink-0 items-center justify-center ${roundedClassName} ${fallbackClassName}`}
        >
            {initials}
        </div>
    );
}
