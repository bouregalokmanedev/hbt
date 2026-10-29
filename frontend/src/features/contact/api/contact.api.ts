import { api } from "@/lib/api/client";
import { visitorId } from "@/features/marketing/tracking";

export interface ContactFormPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    inquiry: string;
    subject: string;
    message: string;
    /** Hidden honeypot — bots fill it, humans never see it. */
    website?: string;
    turnstileToken?: string | null;
}

/** UTM params from the landing URL, kept for lead attribution. */
export function captureUtm(): Record<string, string | null> {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_term: params.get("utm_term"),
        utm_content: params.get("utm_content"),
        course_interest: params.get("course"),
    };
}

export async function sendContactMessage(payload: ContactFormPayload): Promise<void> {
    const utm = captureUtm();
    await api<{ id: number }>("/v1/contact", {
        method: "POST",
        body: {
            first_name: payload.firstName.trim(),
            last_name: payload.lastName.trim() || null,
            email: payload.email.trim(),
            phone: payload.phone.trim() || null,
            inquiry: payload.inquiry || null,
            subject: payload.subject.trim(),
            message: payload.message.trim(),
            visitor_id: visitorId(),
            source: "contact_form",
            course_interest: utm.course_interest,
            utm_source: utm.utm_source,
            utm_medium: utm.utm_medium,
            utm_campaign: utm.utm_campaign,
            utm_term: utm.utm_term,
            utm_content: utm.utm_content,
            ...(payload.website ? { website: payload.website } : {}),
            ...(payload.turnstileToken
                ? { turnstile_token: payload.turnstileToken }
                : {}),
        },
    });
}
