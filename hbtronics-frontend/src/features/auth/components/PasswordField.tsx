import {
    Eye,
    EyeOff,
    LockKeyhole,
} from "lucide-react";

import type {
    InputHTMLAttributes,
} from "react";

import {
    useState,
} from "react";

interface PasswordFieldProps
    extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    showLabel?: string;
    hideLabel?: string;
}

export function PasswordField({
    label,
    error,
    id,
    showLabel = "Show password",
    hideLabel = "Hide password",
    className = "",
    ...props
}: PasswordFieldProps) {
    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-xs font-semibold text-[#3A3A3A]"
            >
                {label}
            </label>

            <div className="relative">
                <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#3A3A3A]/35"
                    aria-hidden="true"
                />

                <input
                    {...props}
                    id={id}
                    type={
                        showPassword
                            ? "text"
                            : "password"
                    }
                    className={[
                        "h-12 w-full rounded-xl border bg-white pl-11 pr-12 text-sm text-[#3A3A3A]",
                        "outline-none transition-all",
                        "placeholder:text-[#3A3A3A]/30",
                        "focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10",
                        error
                            ? "border-red-400"
                            : "border-[#3A3A3A]/10",
                        className,
                    ].join(" ")}
                />

                <button
                    type="button"
                    onClick={() =>
                        setShowPassword(
                            (current) =>
                                !current,
                        )
                    }
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-[#3A3A3A]/40 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#F47822]/20"
                    aria-label={
                        showPassword
                            ? hideLabel
                            : showLabel
                    }
                    aria-pressed={
                        showPassword
                    }
                >
                    {showPassword ? (
                        <EyeOff
                            size={17}
                            strokeWidth={1.8}
                        />
                    ) : (
                        <Eye
                            size={17}
                            strokeWidth={1.8}
                        />
                    )}
                </button>
            </div>

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