import { render, screen, fireEvent } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { specialFunctionsStore } from "@/features/instructor/data/specialFunctionsStore";

import { SpecialFunctionsFlow } from "./SpecialFunctionsFlow";

function renderFlow(onExit = () => {}, vciConnected = true) {
    return render(
        <I18nextProvider i18n={i18n}>
            <SpecialFunctionsFlow onExit={onExit} vciConnected={vciConnected} />
        </I18nextProvider>,
    );
}

beforeEach(() => {
    specialFunctionsStore.reset();
});

describe("SpecialFunctionsFlow", () => {
    it("shows an empty state when the instructor has not built any", () => {
        renderFlow();

        expect(screen.getByText("No special functions yet")).toBeInTheDocument();
        expect(
            screen.getByText(/published by your instructor/),
        ).toBeInTheDocument();
    });

    it("walks vehicle → functions → detail and back", () => {
        specialFunctionsStore.add({
            functionId: "oil-reset",
            vehicleVariantId: "v1",
            vehicleLabel: "Toyota Corolla 1.6",
            title: "Oil life reset procedure",
            description: "Reset the service interval after an oil change.",
            image: null,
        });
        specialFunctionsStore.add({
            functionId: "dpf-regen",
            vehicleVariantId: "v1",
            vehicleLabel: "Toyota Corolla 1.6",
            title: "DPF regen steps",
            description: "Park the car and start the regeneration cycle.",
            image: null,
        });
        specialFunctionsStore.add({
            functionId: "tpms-reset",
            vehicleVariantId: "v2",
            vehicleLabel: "BMW 3 Series",
            title: "TPMS sensor reset",
            description: "Relearn all four wheel sensors.",
            image: null,
        });
        renderFlow();

        // 1. Vehicle picker (grouped, with function counts)
        expect(
            screen.getByText("Choose a vehicle to see its special functions"),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Toyota Corolla 1.6, 2 functions" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "BMW 3 Series, 1 function" }),
        ).toBeInTheDocument();

        // 2. Pick the Toyota → OBD check popup → Continue → only its functions
        fireEvent.click(
            screen.getByRole("button", { name: "Toyota Corolla 1.6, 2 functions" }),
        );
        expect(screen.getByText("Check the OBD connection")).toBeInTheDocument();
        // Connected: no status message — the warning line only shows unplugged.
        expect(
            screen.queryByText("OBD is not connected — plug it in to continue"),
        ).toBeNull();
        expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));

        expect(screen.getByText("Special Function")).toBeInTheDocument(); // crumb
        expect(
            screen.getByRole("button", { name: "Oil life reset procedure" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "DPF regen steps" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "TPMS sensor reset" }),
        ).toBeNull();

        // 3. Open a function → detail
        fireEvent.click(
            screen.getByRole("button", { name: "Oil life reset procedure" }),
        );
        expect(
            screen.getByText("Toyota Corolla 1.6 > Oil Reset"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Reset the service interval after an oil change."),
        ).toBeInTheDocument();
        expect(screen.getByText("Vehicle: Toyota Corolla 1.6")).toBeInTheDocument();

        // 4. Back chain: detail → functions → vehicles
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(
            screen.getByRole("button", { name: "Oil life reset procedure" }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(
            screen.getByRole("button", { name: "BMW 3 Series, 1 function" }),
        ).toBeInTheDocument();
    });

    it("blocks Continue on the OBD check popup while the link is unplugged", () => {
        specialFunctionsStore.add({
            functionId: "oil-reset",
            vehicleVariantId: "v1",
            vehicleLabel: "Toyota Corolla 1.6",
            title: "Oil life reset procedure",
            description: "Reset the service interval after an oil change.",
            image: null,
        });
        renderFlow(() => {}, false);

        fireEvent.click(
            screen.getByRole("button", { name: "Toyota Corolla 1.6, 1 function" }),
        );
        expect(screen.getByText("Check the OBD connection")).toBeInTheDocument();
        expect(
            screen.getByText("OBD is not connected — plug it in to continue"),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
        expect(
            screen.queryByRole("button", { name: "Oil life reset procedure" }),
        ).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(screen.queryByText("Check the OBD connection")).toBeNull();
        expect(
            screen.getByRole("button", { name: "Toyota Corolla 1.6, 1 function" }),
        ).toBeInTheDocument();
    });

    it("calls onExit when the vehicle picker Back button is pressed", () => {
        const onExit = vi.fn();
        renderFlow(onExit);

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(onExit).toHaveBeenCalled();
    });
});
