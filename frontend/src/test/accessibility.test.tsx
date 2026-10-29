import { render } from "@testing-library/react";
import axe from "axe-core";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthLanguageProvider } from "@/features/auth/i18n/auth-language";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";

async function expectAccessible(container: HTMLElement) {
    // jsdom cannot talk to embedded frames (the contact page has a map
    // iframe), so scan the surrounding document instead.
    container.querySelectorAll("iframe").forEach((frame) => frame.remove());

    const results = await axe.run(container, {
        rules: {
            // jsdom has no layout engine, so axe cannot evaluate contrast.
            "color-contrast": { enabled: false },
        },
    });

    expect(
        results.violations.map((violation) => ({
            id: violation.id,
            help: violation.help,
            targets: violation.nodes.map((node) => node.target),
        })),
    ).toEqual([]);
}

describe("authentication pages accessibility", () => {
    it("login page has no detectable axe violations", async () => {
        const { container } = render(
            <AuthLanguageProvider>
                <MemoryRouter initialEntries={["/login"]}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                    </Routes>
                </MemoryRouter>
            </AuthLanguageProvider>,
        );

        await expectAccessible(container);
    });

    it("registration page has no detectable axe violations", async () => {
        const { container } = render(
            <AuthLanguageProvider>
                <MemoryRouter initialEntries={["/register"]}>
                    <Routes>
                        <Route path="/register" element={<RegisterPage />} />
                    </Routes>
                </MemoryRouter>
            </AuthLanguageProvider>,
        );

        await expectAccessible(container);
    });
});

describe("public contact page accessibility", () => {
    it("contact page has no detectable axe violations", async () => {
        const { ContactPage } = await import("@/features/contact/ContactPage");

        const { container } = render(
            <MemoryRouter initialEntries={["/contact"]}>
                <ContactPage />
            </MemoryRouter>,
        );

        await expectAccessible(container);
    });
});
