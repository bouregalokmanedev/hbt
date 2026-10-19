import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import i18next from "i18next";

import { changeLanguage } from "@/i18n";
import { MarketingNavbar } from "@/layouts/marketing/MarketingNavbar";
import { MarketingDashboardPage } from "./MarketingDashboardPage";
import { marketingApi } from "../api/marketing.api";
import { overviewFixture } from "./overview.fixture";

vi.mock("../api/marketing.api", () => ({
    marketingApi: {
        overview: vi.fn(),
        performance: vi.fn(),
        setQuota: vi.fn(),
    },
}));

async function useLanguage(language: "en" | "ar") {
    changeLanguage(language);
    await waitFor(() => expect(i18next.language).toBe(language));
}

describe("sales dashboard localization", () => {
    beforeEach(() => {
        vi.mocked(marketingApi.overview).mockResolvedValue(overviewFixture);
        vi.mocked(marketingApi.performance).mockResolvedValue({ month: "2026-10", reps: [] });
    });

    afterEach(async () => {
        // The i18n singleton is shared across files in a worker — always
        // hand the next test its English default back.
        await useLanguage("en");
    });

    it("renders the dashboard in Arabic when the language is ar", async () => {
        await useLanguage("ar");

        render(
            <MemoryRouter>
                <MarketingDashboardPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("لوحة المبيعات")).toBeInTheDocument();
        expect(screen.getByText("مساحة عمل المبيعات")).toBeInTheDocument();
        expect(screen.getByText("الإيرادات · 7 أيام")).toBeInTheDocument();
        expect(screen.getByText("تحتاج انتباهًا")).toBeInTheDocument();
        expect(screen.getByText("أحدث النشاطات")).toBeInTheDocument();
    });

    it("localizes the sales navbar switcher and badge", async () => {
        await useLanguage("ar");

        render(
            <MemoryRouter>
                <MarketingNavbar onMenuClick={() => undefined} />
            </MemoryRouter>,
        );

        // Badge + the Globe pill's target-language label (same as other dashboards).
        expect(await screen.findByText("المبيعات")).toBeInTheDocument();
        expect(screen.getByText("EN")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "التبديل إلى الإنجليزية" })).toBeInTheDocument();
    });

    it("falls back to English after switching back", async () => {
        await useLanguage("en");

        render(
            <MemoryRouter>
                <MarketingDashboardPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("Sales dashboard")).toBeInTheDocument();
        expect(screen.getByText("Needs attention")).toBeInTheDocument();
    });
});
