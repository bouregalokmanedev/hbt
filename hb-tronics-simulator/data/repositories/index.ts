import { staticRepositories } from "./static";
import { httpRepositories } from "./http";
import { isHttpDataSource } from "@/lib/flags";
import type { Repositories, RepoContext } from "./types";

export * from "./types";

/**
 * Repository provider (10 §15 + M3.4). Flag-selectable: static reproduces
 * today's behavior exactly; http delegates reference data to static and
 * commits record via API. Accepts optional session-derived RepoContext
 * without requiring callers to change imports.
 */
export function getRepositories(ctx?: RepoContext): Repositories {
  void ctx;
  return isHttpDataSource ? httpRepositories : staticRepositories;
}
