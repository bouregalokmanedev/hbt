interface AuthHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
}

export function AuthHeader({
    eyebrow,
    title,
    description,
}: AuthHeaderProps) {
    return (
        <header className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                {eyebrow}
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[#3A3A3A] sm:text-[30px]">
                {title}
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/60">
                {description}
            </p>
        </header>
    );
}