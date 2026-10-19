import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { supportDeskApi, type DeskStudentDetail } from "../api/supportDesk.api";
import { SupportStudentDetailPage } from "./SupportStudentDetailPage";

vi.mock("../api/supportDesk.api", () => ({
    supportDeskApi: {
        student: vi.fn(),
    },
}));

const api = vi.mocked(supportDeskApi);

const fixture: DeskStudentDetail = {
    id: "s1",
    name: "Nadia Bensalem",
    email: "nadia@example.com",
    status: "active",
    verified: true,
    joined_at: "2026-01-05T09:00:00.000Z",
    last_active_at: "2026-10-12T10:00:00.000Z",
    summary: { enrollments: 2, completed: 1, certificates: 1, open_tickets: 1 },
    enrollments: [
        {
            id: "e1",
            status: "completed",
            enrolled_at: "2026-02-01T09:00:00.000Z",
            completed_at: "2026-03-01T09:00:00.000Z",
            course: { id: 1, title: "Electrical Fundamentals", status: "published" },
            progress_percentage: 100,
            time_spent: 3600,
        },
    ],
    certificates: [
        {
            id: "c1",
            certificate_number: "HBT-001",
            course_title: "Electrical Fundamentals",
            issued_at: "2026-03-01T09:00:00.000Z",
        },
    ],
    tickets: [
        {
            id: "t1",
            subject: "Cannot download certificate",
            category: "certification",
            status: "open",
            priority: "high",
            overdue: false,
            created_at: "2026-10-10T09:00:00.000Z",
        },
    ],
};

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/support-desk/students/s1"]}>
                <Routes>
                    <Route path="/support-desk/students/:studentId" element={<SupportStudentDetailPage />} />
                </Routes>
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("SupportStudentDetailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.student.mockResolvedValue(fixture);
    });

    it("renders the student summary, enrollments, certificates and tickets", async () => {
        renderPage();

        expect(await screen.findByText("Nadia Bensalem")).toBeInTheDocument();
        expect(screen.getByText("nadia@example.com")).toBeInTheDocument();
        // Course title appears in both the enrollment list and the certificate list.
        expect(screen.getAllByText("Electrical Fundamentals").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("HBT-001")).toBeInTheDocument();
        expect(screen.getByText("Cannot download certificate")).toBeInTheDocument();
    });

    it("surfaces a load failure", async () => {
        api.student.mockRejectedValue(new Error("boom"));
        renderPage();

        expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    });
});
