import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { supportDeskApi, type DeskStudentListResponse } from "../api/supportDesk.api";
import { SupportStudentsPage } from "./SupportStudentsPage";

vi.mock("../api/supportDesk.api", () => ({
    supportDeskApi: {
        students: vi.fn(),
    },
}));

const api = vi.mocked(supportDeskApi);

const fixture: DeskStudentListResponse = {
    data: [
        {
            id: "s1",
            name: "Nadia Bensalem",
            email: "nadia@example.com",
            status: "active",
            verified: true,
            enrollments_count: 3,
            completed_count: 1,
            certificates_count: 1,
            open_tickets: 2,
            last_active_at: "2026-10-12T10:00:00.000Z",
            joined_at: "2026-01-05T09:00:00.000Z",
        },
    ],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter>
                <SupportStudentsPage />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("SupportStudentsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.students.mockResolvedValue(fixture);
    });

    it("renders the directory with student rows", async () => {
        renderPage();

        expect(await screen.findByText("Nadia Bensalem")).toBeInTheDocument();
        expect(screen.getByText("nadia@example.com")).toBeInTheDocument();
        expect(screen.getByText("Student directory")).toBeInTheDocument();
        await waitFor(() => expect(api.students).toHaveBeenCalled());
    });

    it("renders the empty state when no students match", async () => {
        api.students.mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } });
        renderPage();

        expect(await screen.findByText("No students found")).toBeInTheDocument();
    });

    it("surfaces a load failure", async () => {
        api.students.mockRejectedValue(new Error("boom"));
        renderPage();

        expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    });
});
