import { expect, test } from "@playwright/test";

test("landing page renders navigation and hero", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Master modern automotive diagnostics",
    );
    await expect(
        page.getByRole("link", { name: /courses/i }).first(),
    ).toBeVisible();
});

test("login page reports missing credentials without a network call", async ({
    page,
}) => {
    await page.goto("/login");

    await expect(
        page.getByRole("heading", { name: /sign in to your account/i }),
    ).toBeVisible();

    // Dismiss the consent banner so it cannot overlap the form controls.
    await page.getByRole("button", { name: /reject all/i }).first().click();

    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(
        page.getByText(/this field is required/i).first(),
    ).toBeVisible();
});

test("unknown routes render the branded 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page.getByText(/page not found/i).first()).toBeVisible();
});

test("courses hover opens the mega-menu with best sellers and verification", async ({
    page,
}) => {
    const course = (id: string, title: string, duration: number, difficulty: string) => ({
        id,
        title,
        slug: id,
        short_description: "",
        description: "",
        language: "en",
        difficulty,
        duration_minutes: duration,
        price: 0,
        discount_price: null,
        currency: "DZD",
        is_free: true,
        status: "published",
        visibility: "public",
        thumbnail: null,
        cover_image: null,
        preview_video: null,
        published_at: null,
        created_at: "",
        updated_at: "",
    });

    await page.route("**/api/v1/catalog/courses*", (route) =>
        route.fulfill({
            json: {
                data: [
                    course("can-bus", "CAN Bus Diagnostics", 185, "intermediate"),
                    course("ev-hybrid", "EV & Hybrid Systems", 360, "advanced"),
                    course("electrical", "Electrical Foundations", 45, "beginner"),
                    course("hybrid", "Hybrid Powertrain", 240, "intermediate"),
                ],
                links: { first: null, last: null, prev: null, next: null },
                meta: {
                    current_page: 1,
                    from: 1,
                    last_page: 1,
                    per_page: 24,
                    to: 4,
                    total: 4,
                    path: "/api/v1/catalog/courses",
                    links: [],
                },
            },
        }),
    );

    await page.route("**/api/v1/featured", (route) =>
        route.fulfill({
            json: {
                data: [
                    {
                        course_id: "ev-hybrid",
                        badge_label: "Bestseller",
                        title: "EV & Hybrid Systems",
                        slug: "ev-hybrid",
                    },
                ],
            },
        }),
    );

    await page.goto("/");

    const courses = page.getByRole("link", { name: /^courses$/i }).first();

    await courses.hover();

    await expect(page.getByTestId("courses-mega-menu")).toBeVisible();

    const cards = page.getByTestId("courses-mega-card");

    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText("EV & Hybrid Systems");
    await expect(cards.first()).toContainText("6 h");
    await expect(cards.first()).toContainText("Advanced");

    await expect(
        page.getByRole("heading", {
            name: /verified at the source/i,
        }),
    ).toBeVisible();

    await expect(
        page.getByRole("link", { name: /verify a certificate/i }).first(),
    ).toHaveAttribute("href", "/verify-certificate");

    // Moving from the trigger into the panel must keep it open long enough
    // to interact with the links.
    const verifyLink = page
        .getByRole("link", { name: /verify a certificate/i })
        .first();

    await verifyLink.hover();
    await expect(page.getByTestId("courses-mega-menu")).toBeVisible();

    await verifyLink.click();
    await expect(page).toHaveURL(/\/verify-certificate$/);
});

const bootcampFixtures = [
    {
        id: "ev-hybrid",
        title: "EV & Hybrid Systems",
        slug: "ev-hybrid-systems",
        short_description: "High-voltage safety and battery diagnosis.",
        description: "A hands-on bootcamp on live high-voltage vehicles.",
        duration_value: 6,
        duration_unit: "weeks",
        location: "Algiers · Hydra",
        price: 89000,
        currency: "DZD",
        level: "advanced",
        includes: {
            challenges: true,
            resources: true,
            quizzes: true,
            support: true,
            certificate: true,
        },
        status: "published",
        brochure_available: false,
        brochure_name: null,
        published_at: "2026-10-01T10:00:00.000Z",
        created_at: "2026-10-01T10:00:00.000Z",
        updated_at: "2026-10-01T10:00:00.000Z",
        registered_count: 8,
        instructor: null,
        schedules: [
            {
                id: "schedule-1",
                bootcamp_id: "ev-hybrid",
                starts_at: "2026-11-10",
                ends_at: "2026-12-08",
                is_available: true,
            },
        ],
        sections: [],
    },
    {
        id: "can-bus",
        title: "CAN Bus & ECU",
        slug: "can-bus-ecu",
        short_description: "Network faults, modules and live data.",
        description: "Diagnose network faults on real vehicles.",
        duration_value: 3,
        duration_unit: "weeks",
        location: "Oran",
        price: 65000,
        currency: "DZD",
        level: "intermediate",
        includes: {
            challenges: true,
            resources: true,
            quizzes: false,
            support: true,
            certificate: true,
        },
        status: "published",
        brochure_available: false,
        brochure_name: null,
        published_at: "2026-10-02T10:00:00.000Z",
        created_at: "2026-10-02T10:00:00.000Z",
        updated_at: "2026-10-02T10:00:00.000Z",
        registered_count: 5,
        instructor: null,
        schedules: [],
        sections: [],
    },
    {
        id: "diagnostics",
        title: "Automotive Diagnostics",
        slug: "automotive-diagnostics",
        short_description: "The core diagnostic method.",
        description: "Read the system, isolate the fault, prove the repair.",
        duration_value: 8,
        duration_unit: "weeks",
        location: "Constantine",
        price: 72000,
        currency: "DZD",
        level: "beginner",
        includes: {
            challenges: true,
            resources: true,
            quizzes: true,
            support: true,
            certificate: true,
        },
        status: "published",
        brochure_available: false,
        brochure_name: null,
        published_at: "2026-10-03T10:00:00.000Z",
        created_at: "2026-10-03T10:00:00.000Z",
        updated_at: "2026-10-03T10:00:00.000Z",
        registered_count: 12,
        instructor: null,
        schedules: [],
        sections: [],
    },
];

async function mockBootcampCatalog(page: import("@playwright/test").Page) {
    await page.route("**/api/v1/catalog/bootcamps*", (route) => {
        const url = route.request().url();

        if (url.includes("/calendar")) {
            return route.fulfill({ json: { data: [] } });
        }

        return route.fulfill({
            json: {
                data: bootcampFixtures,
                links: { first: null, last: null, prev: null, next: null },
                meta: {
                    current_page: 1,
                    from: 1,
                    last_page: 1,
                    per_page: 9,
                    to: bootcampFixtures.length,
                    total: bootcampFixtures.length,
                    path: "/api/v1/catalog/bootcamps",
                    links: [],
                },
            },
        });
    });
}

test("bootcamps catalog is reachable from the main navigation", async ({
    page,
}) => {
    await mockBootcampCatalog(page);

    await page.goto("/");

    await page
        .getByRole("link", { name: /^bootcamps$/i })
        .first()
        .click();

    await expect(page).toHaveURL(/\/bootcamps$/);

    await expect(
        page.getByRole("heading", { level: 1, name: /hands-on bootcamps/i }),
    ).toBeVisible();

    await expect(page.getByTestId("bootcamp-card")).toHaveCount(3);
    await expect(
        page.getByRole("heading", { name: "EV & Hybrid Systems" }),
    ).toBeVisible();
});

test("bootcamps hover opens a catalog dropdown without the certificate card", async ({
    page,
}) => {
    await mockBootcampCatalog(page);

    await page.goto("/");

    const bootcamps = page
        .getByRole("link", { name: /^bootcamps$/i })
        .first();

    await bootcamps.hover();

    const panel = page.getByTestId("bootcamps-mega-menu");

    await expect(panel).toBeVisible();
    await expect(page.getByTestId("bootcamp-mega-card")).toHaveCount(3);
    await expect(page.getByTestId("bootcamp-mega-card").first()).toContainText(
        "EV & Hybrid Systems",
    );
    await expect(
        panel.getByRole("link", { name: /view cohort calendar/i }).first(),
    ).toHaveAttribute("href", "/bootcamps?view=calendar");
    await expect(
        panel.getByRole("link", { name: /verify a certificate/i }),
    ).toHaveCount(0);

    await panel
        .getByRole("link", { name: /browse all bootcamps/i })
        .first()
        .click();

    await expect(page).toHaveURL(/\/bootcamps$/);
});
