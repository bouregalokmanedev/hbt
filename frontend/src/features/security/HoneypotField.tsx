import type { InputHTMLAttributes } from "react";

import { BOT_HONEYPOT_FIELD } from "./botProtection";

type HoneypotFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    fieldName?: string;
};

/**
 * Off-screen honeypot input. Humans never see or focus it; bots that
 * autofill every field send a value and the API rejects the request.
 */
export function HoneypotField({
    fieldName = BOT_HONEYPOT_FIELD,
    ...props
}: HoneypotFieldProps) {
    const id = `bot-${fieldName}`;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none sr-only"
        >
            <label htmlFor={id}>Leave this field empty</label>
            <input
                {...props}
                id={id}
                name={props.name ?? fieldName}
                type="text"
                tabIndex={-1}
                autoComplete="off"
            />
        </div>
    );
}
