// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { StatusBadge } from "@/components/shared/StatusBadge";

afterEach(cleanup);

describe("SegmentedControl", () => {
  it("renders options, marks the selected one, and calls onChange", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="b"
        onChange={onChange}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );
    const beta = screen.getByRole("radio", { name: "Beta" });
    expect(beta.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Alpha" }));
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("routes locked options to onLocked instead of onChange", () => {
    const onChange = vi.fn();
    const onLocked = vi.fn();
    render(
      <SegmentedControl
        value="a"
        onChange={onChange}
        onLocked={onLocked}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta", locked: true },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Beta" }));
    expect(onLocked).toHaveBeenCalledWith("b");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ToggleSwitch", () => {
  it("exposes switch role + aria-checked and toggles", () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} ariaLabel="Hints" />);
    const sw = screen.getByRole("switch", { name: "Hints" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("StatusBadge", () => {
  it("renders colour + glyph redundancy", () => {
    render(
      <StatusBadge kind="fault" glyph="!">
        OUT OF SPEC
      </StatusBadge>,
    );
    expect(screen.getByText("OUT OF SPEC")).toBeTruthy();
    expect(screen.getByText("!")).toBeTruthy();
  });
});
