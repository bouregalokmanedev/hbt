import { env } from "@/config/env";
import { handleUnauthorizedResponse } from "@/lib/api/unauthorized";
import { authStorage } from "@/lib/storage/auth-storage";

import type { Certificate } from "../types/certificate.types";

export async function getCertificates(): Promise<Certificate[]> {
    const token = authStorage.getToken();
    const response = await fetch(`${env.apiUrl}/v1/certificates`, {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token ?? ""}`,
        },
    });

    if (!response.ok) {
        handleUnauthorizedResponse(response.status, Boolean(token));
        throw new Error("Unable to load certificates.");
    }
    const payload = await response.json() as { data: Certificate[] };
    return payload.data;
}

export function getCertificateDownloadUrl(certificateId: string): string {
    return `${env.apiUrl}/v1/certificates/${certificateId}/download`;
}

/** Public verification link a learner can paste anywhere (no auth needed). */
export function certificateVerifyPath(certificate: Certificate): string {
    return `/verify/${certificate.certificate_number}`;
}

export async function downloadCertificate(certificate: Certificate): Promise<void> {
    const token = authStorage.getToken();
    const response = await fetch(getCertificateDownloadUrl(certificate.id), {
        headers: {
            Accept: "application/pdf",
            Authorization: `Bearer ${token ?? ""}`,
        },
    });

    if (!response.ok) {
        handleUnauthorizedResponse(response.status, Boolean(token));
        throw new Error("Unable to download certificate.");
    }

    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `HBT-certificate-${certificate.certificate_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
}
