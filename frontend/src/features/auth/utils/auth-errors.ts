import type { authTranslations } from "../i18n/auth.translations";

type AuthTranslations = typeof authTranslations.en;

export const NAME_PATTERN = /^[\p{L}][\p{L}\s'’-]*$/u;

export function hasNameNumber(value: string): boolean {
    return /\d/.test(value);
}

export function isValidName(value: string): boolean {
    return NAME_PATTERN.test(value.trim());
}

export function localAuthErrorMessage(
    code: string | null | undefined,
    t: AuthTranslations,
    fallback: string,
): string {
    switch (code) {
        case "invalid_credentials":
            return t.errors.invalidCredentials;
        case "email_not_verified":
            return t.errors.emailNotVerified;
        case "account_inactive":
            return t.errors.accountInactive;
        case "rate_limited":
            return t.errors.rateLimited;
        case "validation_failed":
            return t.errors.validationFailed;
        default:
            if (fallback) return fallback;
            // No code and no message means nothing failed — never fabricate
            // a scary banner on a pristine login/register form.
            return code ? t.errors.unknown : "";
    }
}

export function mapServerErrorToField(
    serverField: string,
    message: string,
    t: AuthTranslations,
): string {
    const normalized = message.toLowerCase();

    if (
        normalized.includes("already been taken") ||
        normalized.includes("already registered") ||
        normalized.includes("already exists")
    ) {
        if (serverField === "email") {
            return "This email address is already registered.";
        }
        if (serverField === "username") {
            return "This username is already taken.";
        }
    }

    if (serverField === "first_name" || serverField === "last_name") {
        if (
            normalized.includes("letters") ||
            normalized.includes("regex") ||
            normalized.includes("may only contain")
        ) {
            return t.common.nameLettersOnly;
        }
    }

    if (serverField === "password" && normalized.includes("at least 8")) {
        return t.common.passwordMinLength;
    }

    if (
        (serverField === "first_name" || serverField === "last_name") &&
        hasNameNumber(message)
    ) {
        return t.common.nameLettersOnly;
    }

    if (serverField === "email" && normalized.includes("valid")) {
        return t.common.invalidEmail;
    }

    return message;
}

const FIELD_ALIASES: Record<string, string> = {
    first_name: "firstName",
    last_name: "lastName",
    password_confirmation: "passwordConfirmation",
    passwordConfirm: "passwordConfirmation",
};

export function applyServerFieldErrors(
    fieldErrors: Record<string, string[]> | null | undefined,
    t: AuthTranslations,
    setError: (field: never, error: { type: string; message: string }) => void,
    allowedFields: string[],
): boolean {
    if (!fieldErrors) {
        return false;
    }

    let applied = false;

    for (const [serverField, messages] of Object.entries(fieldErrors)) {
        const formField = FIELD_ALIASES[serverField] ?? serverField;
        if (!allowedFields.includes(formField)) {
            continue;
        }
        const first = messages?.[0];
        if (!first) {
            continue;
        }
        setError(formField as never, {
            type: "server",
            message: mapServerErrorToField(serverField, first, t),
        });
        applied = true;
    }

    return applied;
}
