import {
    useState,
} from "react";

import type {
    InputHTMLAttributes,
} from "react";

import { Input } from "@/components/ui/input";

interface PasswordInputProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "type"
    > {
    error?: string ;
}

export function PasswordInput({
    error,
    ...props
}: PasswordInputProps) {
    const [
        visible,
        setVisible,
    ] = useState(false);

    return (
        <div className="relative">
            <Input
                {...props}
                error={error}
                type={
                    visible
                        ? "text"
                        : "password"
                }
                className="pr-12"
            />

            <button
                type="button"
                onClick={() =>
                    setVisible(
                        (value) =>
                            !value,
                    )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
                {visible
                    ? "Hide"
                    : "Show"}
            </button>
        </div>
    );
}