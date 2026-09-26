import { env } from "@/config/env";

import {
    isPlausibleCertificateNumber,
    normalizeCertificateNumber,
    VerifyCertificateError,
    type VerifiedCertificate,
} from "../types";

interface VerifyApiPayload {
    data: VerifiedCertificate;
}

export async function verifyCertificate(rawNumber: string): Promise<VerifiedCertificate> {
    const certificateNumber = normalizeCertificateNumber(rawNumber);

    if (!certificateNumber) {
        throw new VerifyCertificateError("invalid-input", "Enter a certificate ID to start verification.");
    }

    if (!isPlausibleCertificateNumber(certificateNumber)) {
        throw new VerifyCertificateError(
            "invalid-input",
            "That ID doesn't look valid. It should look like HBT-XXXXXXXXXXXXXX.",
        );
    }

    let response: Response;
    try {
        response = await fetch(
            `${env.apiUrl}/v1/certificates/verify/${encodeURIComponent(certificateNumber)}`,
            {
                method: "GET",
                headers: { Accept: "application/json" },
            },
        );
    } catch {
        throw new VerifyCertificateError(
            "network",
            "Unable to reach the verification service. Check your connection and try again.",
        );
    }

    if (response.status === 404) {
        throw new VerifyCertificateError(
            "not-found",
            "No certificate was found for this ID. Double-check the code and try again.",
        );
    }

    if (!response.ok) {
        throw new VerifyCertificateError(
            "server",
            "Verification is temporarily unavailable. Please try again in a moment.",
        );
    }

    try {
        const payload = (await response.json()) as VerifyApiPayload;
        if (!payload?.data?.certificate_number) {
            throw new Error("Malformed verification response");
        }
        return payload.data;
    } catch (error) {
        if (error instanceof VerifyCertificateError) throw error;
        throw new VerifyCertificateError(
            "server",
            "We received an unexpected response from the verification service. Please try again.",
        );
    }
}
