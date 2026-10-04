import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { HelpCenterPage } from "./HelpCenterPage";

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/help"]}>
                <HelpCenterPage />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

function helpLinks() {
    return screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
        .filter((href) => Boolean(href) && href !== "/help");
}

describe("HelpCenterPage", () => {
    it("renders the hero and the bundled articles", () => {
        renderPage();

        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
        expect(helpLinks().some((href) => href?.startsWith("/help/"))).toBe(true);
    });

    it("filters the list as the user types", () => {
        renderPage();

        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "certificate" } });

        expect(helpLinks()).toContain("/help/certificates");
    });

    it("offers a no-results state with a way back", () => {
        renderPage();

        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzzzz" } });

        expect(screen.getByText(/nothing matched/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
        expect(helpLinks().some((href) => href?.startsWith("/help/"))).toBe(true);
    });
});
