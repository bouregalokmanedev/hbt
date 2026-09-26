/**
 * Session seam (10 §7/§15, review F13). The single source of *who* the current
 * user is. This is an ARCHITECTURE SEAM, not authentication: no credentials are
 * verified and no tokens are minted here (the login screen is a front-end gate
 * only — there is no backend, by design). It exists so that identity can flow
 * into the Repository layer's `RepoContext` ({userId, tenantId}) the day a real
 * auth provider arrives, with ZERO changes in the UI, State, or Simulation layers.
 *
 * Framework-free on purpose (no react/next imports) so it can be exercised from
 * tests and, later, from a server context. A real provider satisfies the same
 * `SessionSource` interface via {@link setSessionSource}.
 */
import type { RepoContext } from "@/data/repositories/types";

export interface Session {
  userId: string;
  tenantId: string;
  /** Display name for chrome that opts to show identity (falls back to i18n chrome today). */
  displayName: string;
  /** True only once a real auth provider has verified the user. */
  authenticated: boolean;
}

export interface SessionSource {
  current(): Session;
}

/** The anonymous local session used by the offline, backend-free build. */
export const ANONYMOUS_SESSION: Session = {
  userId: "local",
  tenantId: "local",
  displayName: "Technician",
  authenticated: false,
};

/**
 * Default source: a fixed local session. Never performs I/O. A future backend
 * swaps this out with {@link setSessionSource} without touching any caller.
 */
export class LocalSessionSource implements SessionSource {
  constructor(private readonly session: Session = ANONYMOUS_SESSION) {}
  current(): Session {
    return this.session;
  }
}

let activeSource: SessionSource = new LocalSessionSource();

/** Install a different session source (e.g. a real auth provider). Future-API seam only. */
export function setSessionSource(source: SessionSource): void {
  activeSource = source;
}

/** Reset to the default anonymous local source (used by tests and sign-out). */
export function resetSessionSource(): void {
  activeSource = new LocalSessionSource();
}

/** The current session, from whichever source is installed. */
export function getSession(): Session {
  return activeSource.current();
}

/**
 * Project a Session into the Repository layer's identity context. This is the
 * one contracted consumer of the seam: `getRepositories()` methods already accept
 * an optional `RepoContext`, so passing `toRepoContext()` lets per-user
 * authorization arrive server-side later without changing call sites.
 */
export function toRepoContext(session: Session = getSession()): RepoContext {
  return { userId: session.userId, tenantId: session.tenantId };
}
