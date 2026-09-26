import type { LucideProps } from "lucide-react";

import { resolveBadgeIcon } from "./badge-icons";

export function BadgeIcon({
    id,
    title,
    icon,
    locked = false,
    className,
    ...props
}: LucideProps & {
    id?: string;
    title?: string;
    icon?: string;
    locked?: boolean;
}) {
    const Icon = resolveBadgeIcon(id, title ?? icon);

    return (
        <Icon
            {...props}
            className={[
                className,
                locked ? "opacity-45 grayscale" : "",
            ]
                .filter(Boolean)
                .join(" ")}
        />
    );
}
