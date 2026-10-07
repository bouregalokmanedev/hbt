import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { PackForm } from "../pages/InstructorSimulatorPage";
import {
    FAULT_CODE_LIBRARY,
    faultCodeByCode,
    searchFaultCodes,
} from "../data/faultCodeLibrary";
import { FaultCodeLibraryPicker } from "./FaultCodeLibraryPicker";

function renderWithI18n(ui: React.ReactElement) {
    return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe("fault code library data", () => {
    it("holds unique, well-formed codes", () => {
        expect(FAULT_CODE_LIBRARY.length).toBeGreaterThanOrEqual(50);
        const codes = FAULT_CODE_LIBRARY.map((e) => e.code);
        expect(new Set(codes).size).toBe(codes.length);
        for (const entry of FAULT_CODE_LIBRARY) {
            expect(entry.code).toMatch(/^[PBCU][0-9A-F]{4}$/);
            expect(entry.desc.trim()).not.toBe("");
        }
    });

    it("searches by code prefix and description, case-insensitively", () => {
        expect(searchFaultCodes("p0300").some((e) => e.code === "P0300")).toBe(true);
        expect(searchFaultCodes("misfire").some((e) => e.code === "P0300")).toBe(true);
        expect(searchFaultCodes("").length).toBe(FAULT_CODE_LIBRARY.length);
        expect(searchFaultCodes("zzzz-none")).toHaveLength(0);
        expect(faultCodeByCode(" p0420 ")?.code).toBe("P0420");
        expect(faultCodeByCode("nope")).toBeUndefined();
    });
});

describe("FaultCodeLibraryPicker", () => {
    it("filters on search and hands the picked entry back", () => {
        const onPick = vi.fn();
        renderWithI18n(<FaultCodeLibraryPicker onPick={onPick} />);

        fireEvent.click(screen.getByRole("button", { name: /Add from code library/i }));

        const search = screen.getByRole("textbox", { name: /Search code or description/i });
        fireEvent.change(search, { target: { value: "P0300" } });

        expect(screen.getByText("P0300")).toBeInTheDocument();
        expect(screen.queryByText("P0087")).not.toBeInTheDocument();

        fireEvent.click(screen.getByText("P0300"));
        expect(onPick).toHaveBeenCalledTimes(1);
        expect(onPick.mock.calls[0][0]).toMatchObject({
            code: "P0300",
            ecu: "ECM",
            severity: "high",
        });

        // Panel closes after picking
        expect(screen.queryByRole("textbox", { name: /Search code or description/i })).not.toBeInTheDocument();
    });

    it("shows an empty state when nothing matches", () => {
        renderWithI18n(<FaultCodeLibraryPicker onPick={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: /Add from code library/i }));
        fireEvent.change(screen.getByRole("textbox", { name: /Search code or description/i }), {
            target: { value: "qqqq" },
        });
        expect(screen.getByText("No matching fault codes")).toBeInTheDocument();
    });
});

describe("PackForm scanner fault-variant flow", () => {
    it("adds a fault code picked from the library as a prefilled DTC row", async () => {
        renderWithI18n(
            <PackForm
                variantId="v1"
                initial={null}
                onClose={() => {}}
                onSaved={() => {}}
                onError={() => {}}
            />,
        );

        // Open a blank fault so the fault codes block renders
        fireEvent.click(screen.getByRole("button", { name: /\+ Blank fault/i }));
        expect(screen.getByText("Fault codes")).toBeInTheDocument();

        // Pick P0300 from the library
        fireEvent.click(screen.getByRole("button", { name: /Add from code library/i }));
        fireEvent.change(screen.getByRole("textbox", { name: /Search code or description/i }), {
            target: { value: "p0300" },
        });
        fireEvent.click(screen.getByText("P0300"));

        // Row is prefilled with code + description; typing stays available
        expect(screen.getByDisplayValue("P0300")).toBeInTheDocument();
        expect(
            screen.getByDisplayValue("Random/multiple cylinder misfire detected"),
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText("P0000")).toBeInTheDocument();
    });

    it("still lets instructors type a code by hand, uppercased", async () => {
        renderWithI18n(
            <PackForm
                variantId="v1"
                initial={null}
                onClose={() => {}}
                onSaved={() => {}}
                onError={() => {}}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /\+ Blank fault/i }));
        fireEvent.click(screen.getByRole("button", { name: /\+ Add DTC/i }));

        const input = screen.getByPlaceholderText("P0000");
        fireEvent.change(input, { target: { value: "p1234" } });
        expect(input).toHaveValue("P1234");
    });
});
