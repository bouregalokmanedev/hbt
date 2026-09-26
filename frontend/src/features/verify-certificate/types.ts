export interface VerifiedCertificate {
    id: string;
    certificate_number: string;
    recipient_name: string;
    course_title: string;
    issued_at: string;
    verification_url: string;
}

export type VerifyCertificateErrorCode = "not-found" | "invalid-input" | "network" | "server";

export class VerifyCertificateError extends Error {
    readonly code: VerifyCertificateErrorCode;

    constructor(code: VerifyCertificateErrorCode, message: string) {
        super(message);
        this.name = "VerifyCertificateError";
        this.code = code;
    }
}

/** Normalize user input: trim, drop internal whitespace, uppercase (HBT-XXXX…). */
export function normalizeCertificateNumber(raw: string): string {
    return raw.trim().replace(/\s+/g, "").toUpperCase();
}

export function isPlausibleCertificateNumber(value: string): boolean {
    if (value.length < 6 || value.length > 40) return false;
    return /^[A-Z0-9-]+$/.test(value);
}
