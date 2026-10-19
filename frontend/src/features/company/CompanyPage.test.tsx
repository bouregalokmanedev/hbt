import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";

import i18n from "@/i18n";
import { CompanyPage } from "./CompanyPage";

vi.mock("./../../components/navigation/Navbar", () => ({ Navbar: () => null }));
vi.mock("../landingpage/components/FooterSection", () => ({ Footer: () => null }));
vi.mock("./StatsSection", () => ({ StatsSection: () => null }));

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter>
                <CompanyPage />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("CompanyPage workshop + head core sections", () => {
    it("shows the workshop section with photo slots and features", () => {
        renderPage();

        expect(screen.getByText("Where the training meets the bay.")).toBeInTheDocument();
        expect(screen.getByText("Diagnostic bays")).toBeInTheDocument();
        expect(screen.getByText("Live vehicles")).toBeInTheDocument();
        expect(screen.getByText("Bench tools")).toBeInTheDocument();
        expect(screen.getByText("Training space")).toBeInTheDocument();

        // 4 workshop slots: main + gallery (3).
        expect(screen.getAllByTestId("photo-placeholder")).toHaveLength(9);
    });

    it("shows the head and core member cards", () => {
        renderPage();

        expect(screen.getByText("The people behind HBT.")).toBeInTheDocument();
        expect(screen.getByText("Founder & CEO")).toBeInTheDocument();
        expect(screen.getByText("Head of training")).toBeInTheDocument();
        expect(screen.getByText("Lead instructor")).toBeInTheDocument();
        expect(screen.getByText("Platform engineer")).toBeInTheDocument();
        expect(screen.getByText("Curriculum designer")).toBeInTheDocument();
    });

    it("shows the partnership section with partner types and CTA", () => {
        renderPage();

        expect(screen.getByText("Grow with HBT — as a partner.")).toBeInTheDocument();
        expect(screen.getByText("Training centers")).toBeInTheDocument();
        expect(screen.getByText("Companies & fleets")).toBeInTheDocument();
        expect(screen.getByText("Instructors & experts")).toBeInTheDocument();

        const cta = screen.getByRole("link", { name: /Become a partner/i });
        expect(cta).toHaveAttribute("href", "/contact");
    });
});
