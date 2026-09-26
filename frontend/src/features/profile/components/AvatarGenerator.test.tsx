import { describe, expect, it } from "vitest";

import {
  AVATAR_BG_COLORS,
  HAT_OPTIONS,
  SHIRT_OPTIONS,
  avatarDataUrl,
  avatarSvg,
  randomAvatarOptions,
} from "./AvatarGenerator";

const options = {
  hat: "cap",
  shirt: "polo",
  color: "#2563EB",
} as const;

describe("AvatarGenerator", () => {
  it("draws a square sketch with the chosen color", () => {
    const svg = avatarSvg(options);

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="256" height="256"');
    expect(svg).toContain('viewBox="0 0 256 256"');
    expect(svg).toContain('fill="#2563EB"');
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
  });

  it("never draws a frame ring", () => {
    expect(avatarSvg(options)).not.toContain(
      '<rect x="16" y="16" width="224" height="224"',
    );
  });

  it("renders each hat option as artwork", () => {
    for (const option of HAT_OPTIONS) {
      const svg = avatarSvg({
        ...options,
        hat: option.id,
      });

      expect(svg).toContain("M44 256C44 214 82 192 128 192");
    }

    expect(avatarSvg({ ...options, hat: "crown" })).toContain(
      'fill="#F5C542"',
    );
    expect(avatarSvg({ ...options, hat: "none" })).not.toContain(
      'fill="#F5C542"',
    );
  });

  it("renders each shirt option over the torso", () => {
    for (const option of SHIRT_OPTIONS) {
      const svg = avatarSvg({
        ...options,
        hat: "none",
        shirt: option.id,
      });

      expect(svg).toContain("M44 256C44 214 82 192 128 192");
    }

    expect(
      avatarSvg({ ...options, hat: "none", shirt: "labcoat" }),
    ).toContain('fill="#FFFFFF"');
    expect(
      avatarSvg({ ...options, hat: "none", shirt: "tee" }),
    ).not.toContain('fill="#FFFFFF"');
    expect(
      avatarSvg({ ...options, hat: "none", shirt: "coverall" }),
    ).toContain('d="M128 212v46"');
  });

  it("builds a data URL the profile API accepts", () => {
    const url = avatarDataUrl(options);

    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(
      true,
    );
    expect(decodeURIComponent(url.slice(url.indexOf(",") + 1))).toContain(
      "<svg",
    );
  });

  it("randomizes only known hats, shirts and colors", () => {
    for (let index = 0; index < 25; index += 1) {
      const pick = randomAvatarOptions();

      expect(HAT_OPTIONS.map((option) => option.id)).toContain(pick.hat);
      expect(SHIRT_OPTIONS.map((option) => option.id)).toContain(
        pick.shirt,
      );
      expect(AVATAR_BG_COLORS).toContain(pick.color);
    }
  });

  it("parses as a standalone square svg document", () => {
    const host = document.createElement("div");

    host.innerHTML = avatarSvg(options);

    const svg = host.querySelector("svg");

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("256");
    expect(svg?.getAttribute("height")).toBe("256");
    expect(host.querySelector("path")).not.toBeNull();
    expect(host.querySelector("circle")).not.toBeNull();
  });
});
