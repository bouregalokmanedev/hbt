import { Search, X } from "lucide-react";

interface CourseSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function CourseSearch({
    value,
    onChange,
}: CourseSearchProps) {
    return (
        <div className="relative w-full">
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            />

            <input
                type="search"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder="Search courses, diagnostics, sensors..."
                aria-label="Search courses"
                className="
                    h-14 w-full rounded-2xl
                    border border-border/70
                    bg-background
                    pl-12 pr-12
                    text-sm
                    shadow-sm
                    outline-none
                    transition-all
                    placeholder:text-muted-foreground/70
                    hover:border-border
                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/10
                "
            />

            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="
                        absolute right-3 top-1/2
                        flex h-8 w-8
                        -translate-y-1/2
                        items-center justify-center
                        rounded-lg
                        text-muted-foreground
                        transition
                        hover:bg-muted
                        hover:text-foreground
                    "
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}