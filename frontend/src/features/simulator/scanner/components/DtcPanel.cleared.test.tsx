import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";

import { DtcPanel } from "./DtcPanel";
import { DTCS } from "../data/scanner.data";
import { readClearedCodes, resetClearedCodes } from "../lib/clearedDtcs";

const VEHICLE = "corolla";

function renderPanel() {
  return render(
    <I18nextProvider i18n={i18n}>
      <DtcPanel dtcs={DTCS} onOpenTree={() => undefined} vehicleKey={VEHICLE} />
    </I18nextProvider>,
  );
}

async function clearAllCodes() {
  fireEvent.click(await screen.findByRole("button", { name: /^Clear codes$/i }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: /^Clear codes$/i }));
}

describe("DtcPanel cleared-code persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetClearedCodes(VEHICLE);
  });

  it("lists every code on a fresh vehicle", async () => {
    renderPanel();
    const list = await screen.findByTestId("dtc-list");
    expect(list).toHaveTextContent("P2118");
    expect(readClearedCodes(VEHICLE)).toEqual([]);
  });

  it("keeps codes cleared after a remount (refresh / tab switch)", async () => {
    const first = renderPanel();
    await clearAllCodes();

    await waitFor(() => expect(screen.queryByText("P2118")).toBeNull());
    expect(readClearedCodes(VEHICLE)).toHaveLength(DTCS.length);
    first.unmount();

    renderPanel();
    const list = await screen.findByTestId("dtc-list");
    expect(list).not.toHaveTextContent("P2118");
  });

  it("scopes cleared codes per vehicle", async () => {
    const first = renderPanel();
    await clearAllCodes();
    await waitFor(() => expect(readClearedCodes(VEHICLE)).toHaveLength(DTCS.length));
    first.unmount();

    expect(readClearedCodes("camry")).toEqual([]);
  });
});
