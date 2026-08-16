import type {
    InputHTMLAttributes,
} from "react";

interface AuthInputProps
    extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function AuthInput({
    label,
    error,
    className = "",
    id,
    ...props
}: AuthInputProps) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-xs font-semibold text-[#3A3A3A]"
            >
                {label}
            </label>

            <input
                {...props}
                id={id}
                className={[
                    "h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#3A3A3A]",
                    "outline-none transition-all",
                    "placeholder:text-[#3A3A3A]/30",
                    "focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10",
                    "disabled:cursor-not-allowed disabled:bg-[#F3F3F3] disabled:opacity-70",
                    error
                        ? "border-red-400"
                        : "border-[#3A3A3A]/10",
                    className,
                ].join(" ")}
            />

            {error && (
                <p
                    className="text-xs text-red-500"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}