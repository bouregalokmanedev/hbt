import {
    Eye,
    EyeOff,
    LockKeyhole,
} from "lucide-react";

import type {
    ChangeEvent,
    FocusEvent,
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
    onBlur,
    onChange,
    onFocus,
    value,
    defaultValue,
    ...props
}: PasswordFieldProps) {
    const [
        showPassword,
        setShowPassword,
    ] = useState(false);
    const [isFloating, setIsFloating] = useState(
        Boolean(value ?? defaultValue),
    );

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setIsFloating(event.target.value.length > 0);
        onChange?.(event);
    };

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
        setIsFloating(true);
        onFocus?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        setIsFloating(event.target.value.length > 0);
        onBlur?.(event);
    };

    return (
        <div className="space-y-1.5">
            <fieldset
                className={[
                    "relative m-0 h-14 min-w-0 rounded-xl border p-0 transition-all duration-200",
                    "focus-within:border-2 focus-within:border-[#F47822]",
                    "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-[#F3F3F3] has-[input:disabled]:opacity-70",
                    error ? "border-red-400" : "border-[#3A3A3A]/10",
                ].join(" ")}
            >
                <legend
                    style={{
                        paddingInline: isFloating
                            ? "0.75rem"
                            : "0",
                    }}
                    className={[
                        "ms-11 overflow-hidden whitespace-nowrap text-xs font-semibold leading-none text-transparent transition-[max-width,padding] duration-300 ease-out",
                        isFloating
                            ? "max-w-[calc(100%-3rem)]"
                            : "max-w-0",
                    ].join(" ")}
                >
                    {label}
                </legend>

                <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute start-4 top-1/2 z-10 -translate-y-1/2 text-[#3A3A3A]/35"
                    aria-hidden="true"
                />

                <input
                    {...props}
                    id={id}
                    value={value}
                    defaultValue={defaultValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    aria-label={label}
                    placeholder=""
                    type={
                        showPassword
                            ? "text"
                            : "password"
                    }
                    className={[
                        "auth-floating-input h-full w-full rounded-xl bg-transparent ps-11 pe-12 text-sm text-[#3A3A3A] outline-none",
                        className,
                    ].join(" ")}
                />

                <label
                    htmlFor={id}
                    style={{
                        insetInlineStart: isFloating
                            ? "calc(2.75rem + 0.5rem)"
                            : "2.75rem",
                    }}
                    className={[
                        "pointer-events-none absolute z-10 text-sm leading-none text-[#3A3A3A]/45 transition-[top,transform,font-size,color,inset-inline-start] duration-300 ease-out",
                        isFloating
                            ? "-top-1 -translate-y-1/2 text-[15px] font-semibold text-[#F47822]"
                            : "top-1/2 -translate-y-1/2",
                    ].join(" ")}
                >
                    {label}
                </label>

                <button
                    type="button"
                    onClick={() =>
                        setShowPassword(
                            (current) =>
                                !current,
                        )
                    }
                    className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-[#3A3A3A]/40 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#F47822]/20"
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
            </fieldset>

            {error && (
                <p
                    className="px-1 text-xs text-red-500"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
