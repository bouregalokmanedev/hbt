import { api } from "@/lib/api/client";

export interface ContactFormPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    inquiry: string;
    subject: string;
    message: string;
}

export async function sendContactMessage(payload: ContactFormPayload): Promise<void> {
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
        },
    });
}
