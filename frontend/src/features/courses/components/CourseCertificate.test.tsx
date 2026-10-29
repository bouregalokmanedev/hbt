import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import * as certificatesApi from "@/features/certificates/api/certificates.api";

import type { CourseJourney } from "../types/journey.types";
import { CourseCertificate } from "./CourseCertificate";

vi.mock("@/features/certificates/api/certificates.api", () => ({
    getCertificates: vi.fn(),
    downloadCertificate: vi.fn(),
}));

function journey(overrides: Partial<CourseJourney> = {}): CourseJourney {
    return {
        passed: false,
        certificate_ready: false,
        certificate: null,
        requirements: [],
        lessons: { required: 0, completed: 0, passed: true, next: null },
        sections: [],
        assessments: [],
        quizzes: [],
        practicals: [],
        final_assessment: null,
        next_step: null,
        ...overrides,
    };
}

function renderCertificate(value: CourseJourney | null) {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter>
                <CourseCertificate
                    courseId="course-1"
                    courseTitle="CAN Bus diagnostics"
                    authenticated
                    journey={value}
                />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("CourseCertificate journey integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(certificatesApi.getCertificates).mockResolvedValue([]);
    });

    it("renders the certificate carried by the journey without a second request", async () => {
        renderCertificate(
            journey({
                passed: true,
                certificate_ready: true,
                certificate: {
                    id: "certificate-1",
                    certificate_number: "HBT-2026-0001",
                    issued_at: "2026-10-20T10:00:00Z",
                },
            }),
        );

        expect(await screen.findByText(/HBT-2026-0001/)).toBeInTheDocument();
        expect(screen.getByText("Certificate earned")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /my certificates/i }),
        ).toHaveAttribute("href", "/certificates");
        expect(certificatesApi.getCertificates).not.toHaveBeenCalled();
    });

    it("points a certificate-ready learner to their certificates", async () => {
        renderCertificate(
            journey({
                passed: true,
                certificate_ready: true,
                next_step: null,
            }),
        );

        const cta = await screen.findByRole("link", { name: /view certificate/i });
        expect(cta).toHaveAttribute("href", "/certificates");
        expect(
            screen.getByText(/Every course requirement is complete/),
        ).toBeInTheDocument();

        expect(certificatesApi.getCertificates).toHaveBeenCalledTimes(1);
    });

    it("falls back to the learner journey's next step until certification", async () => {
        renderCertificate(
            journey({
                next_step: {
                    type: "quiz",
                    id: "quiz-1",
                    title: "Checkpoint 1",
                    path: "/courses/course-1/quizzes/quiz-1",
                },
            }),
        );

        const cta = await screen.findByRole("link", {
            name: /continue checkpoint/i,
        });
        expect(cta).toHaveAttribute("href", "/courses/course-1/quizzes/quiz-1");
    });
});
