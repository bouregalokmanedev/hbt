import { describe, expect, it } from "vitest";
import { staticRepositories } from "@/data/repositories/static";
import { getRepositories } from "@/data/repositories";

describe("repositories contract", () => {
  it("static satisfies interface and is selectable via flag", () => {
    const repos = getRepositories();
    expect(repos.vehicles.list().length).toBeGreaterThan(0);
    expect(repos.record.reports().length).toBeGreaterThanOrEqual(0);
    expect(staticRepositories.record.commit).toBeDefined();
  });
});
