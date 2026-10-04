import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { initReactI18next } from "react-i18next";
import i18n from "i18next";

import { TrendChart } from "./TrendChart";
import type { TrendPoint } from "../types/instructor";

i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
        en: {
            translation: {
                instructor: {
                    dashboard: {
                        momentum: {
                            enrollments: "New enrollments",
                            completions: "Completions",
                            summary: "Over {{days}} days: {{enrollments}} new enrollments and {{completions}} completions.",
                        },
                    },
                },
            },
        },
    },
});

const series: TrendPoint[] = [
    { date: "2026-09-24", enrollments: 0, completions: 0 },
    { date: "2026-09-25", enrollments: 3, completions: 1 },
    { date: "2026-09-26", enrollments: 1, completions: 4 },
    { date: "2026-09-27", enrollments: 6, completions: 2 },
];

describe("TrendChart", () => {
    it("draws both series as SVG, not canvas or an external lib", () => {
        const { container } = render(<TrendChart series={series} />);

        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(container.querySelectorAll("canvas")).toHaveLength(0);

        // One filled area + one line for enrollments, one dashed line for completions.
        const paths = container.querySelectorAll("path");
        expect(paths).toHaveLength(3);
        expect(paths[1]).toHaveAttribute("stroke", "#F47822");
        expect(paths[2]).toHaveAttribute("stroke", "#10B981");
    });

    it("exposes a text summary for screen readers", () => {
        render(<TrendChart series={series} />);

        const chart = screen.getByRole("img");
        expect(chart).toHaveAccessibleName(
            "Over 4 days: 10 new enrollments and 7 completions.",
        );
    });

    it("labels the axis at the start, middle and end of the window", () => {
        render(<TrendChart series={series} />);

        const ticks = [...document.querySelectorAll("svg text")]
            .map((node) => node.textContent)
            .filter(Boolean);

        expect(ticks).toContain("Sep 24");
        expect(ticks).toContain("Sep 25");
        expect(ticks).toContain("Sep 27");
    });

    it("renders nothing when there is no data to plot", () => {
        const { container } = render(<TrendChart series={[]} />);

        expect(container.querySelector("svg")).toBeNull();
    });
});
