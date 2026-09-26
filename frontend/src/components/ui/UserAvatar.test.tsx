import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UserAvatar } from "./UserAvatar";

const user = {
  avatar: "data:image/png;base64,AAAA",
  first_name: "Amina",
  last_name: "Belkacem",
};

describe("UserAvatar", () => {
  it("shows the uploaded picture", () => {
    const { container } = render(
      <UserAvatar user={user} className="h-9 w-9" />,
    );

    const img = container.querySelector("img");

    expect(img).toHaveAttribute("src", user.avatar);
    expect(img?.className).toContain("h-9 w-9");
    expect(img?.className).toContain("aspect-square");
    expect(img?.className).toContain("rounded-[16.667%]");
  });

  it("falls back to initials in the same box when there is no picture", () => {
    const { container } = render(
      <UserAvatar
        user={{ ...user, avatar: null }}
        className="h-9 w-9"
        fallbackClassName="bg-[#F47822] text-xs font-bold text-white"
      />,
    );

    const box = screen.getByText("AB");

    expect(container.querySelector("img")).toBeNull();
    expect(box.className).toContain("h-9 w-9");
    expect(box.className).toContain("aspect-square");
    expect(box.className).toContain("rounded-[16.667%]");
    expect(box.className).toContain("bg-[#F47822]");
  });

  it("falls back to initials when the picture fails to load", () => {
    const { container } = render(
      <UserAvatar user={user} className="h-9 w-9" />,
    );

    const img = container.querySelector("img");

    expect(img).not.toBeNull();

    fireEvent.error(img!);

    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});
