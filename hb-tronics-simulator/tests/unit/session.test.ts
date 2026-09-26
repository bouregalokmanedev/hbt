import { describe, it, expect, afterEach } from "vitest";
import {
  ANONYMOUS_SESSION,
  LocalSessionSource,
  getSession,
  setSessionSource,
  resetSessionSource,
  toRepoContext,
  type SessionSource,
} from "@/lib/session";

afterEach(() => resetSessionSource());

describe("session seam", () => {
  it("defaults to the anonymous, unauthenticated local session", () => {
    expect(getSession()).toEqual(ANONYMOUS_SESSION);
    expect(getSession().authenticated).toBe(false);
  });

  it("projects identity into a RepoContext ({userId, tenantId})", () => {
    expect(toRepoContext()).toEqual({ userId: "local", tenantId: "local" });
  });

  it("honours a swapped-in source (future auth provider) with zero caller changes", () => {
    const backend: SessionSource = {
      current: () => ({ userId: "u_42", tenantId: "acme", displayName: "Sam", authenticated: true }),
    };
    setSessionSource(backend);
    expect(getSession().userId).toBe("u_42");
    expect(getSession().authenticated).toBe(true);
    expect(toRepoContext()).toEqual({ userId: "u_42", tenantId: "acme" });
  });

  it("resets back to the default local source", () => {
    setSessionSource(new LocalSessionSource({ userId: "x", tenantId: "y", displayName: "Z", authenticated: true }));
    resetSessionSource();
    expect(getSession()).toEqual(ANONYMOUS_SESSION);
  });
});
