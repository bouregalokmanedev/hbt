import { authStorage } from "@/lib/storage/auth-storage";

/**
 * Fired whenever the API rejects the current session. AuthInitializer listens
 * for it and resets the Zustand store, so a 401 clears the in-memory user even
 * when the browser is already on a public/auth page.
 */
export const SESSION_EXPIRED_EVENT = "hbt:session-expired";

const AUTH_PATHS = [
  /^\/login\/?$/,
  /^\/register\/?$/,
  /^\/forgot-password\/?$/,
  /^\/reset-password\/?$/,
  /^\/auth\/google\/callback\/?$/,
];

let redirecting = false;

interface HandleOptions {
  /** Current browser path; injectable for tests. */
  pathname?: string;
  /** Current query string; injectable for tests. */
  search?: string;
  /** Navigation function; injectable for tests. */
  redirect?: (url: string) => void;
}

/**
 * Central 401 handling for every API transport in the app.
 *
 * - A 401 that carried a token means the session is no longer valid, so the
 *   token is cleared and the store is told to drop the user.
 * - Exactly one full-page redirect to /login happens, and only from a page
 *   that is not already an auth page. This prevents redirect loops when the
 *   login request itself returns 401 (bad credentials) or when several
 *   parallel queries all fail at once.
 * - The original path is preserved in `next` so the learner returns there
 *   after signing in again.
 */
export function handleUnauthorizedResponse(
  status: number,
  hadToken: boolean,
  options: HandleOptions = {},
): void {
  if (status !== 401) return;

  if (hadToken) {
    authStorage.clearToken();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  // A rejected login attempt with no session is a form error, not an expiry.
  if (!hadToken) return;

  const pathname =
    options.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");

  if (!pathname || AUTH_PATHS.some((pattern) => pattern.test(pathname))) {
    return;
  }

  if (redirecting) return;
  redirecting = true;

  const search =
    options.search ??
    (typeof window !== "undefined" ? window.location.search : "");
  const next = encodeURIComponent(`${pathname}${search}`);
  const url = `/login?next=${next}`;

  const redirect =
    options.redirect ??
    ((target: string) => {
      window.location.assign(target);
    });

  redirect(url);
}

/** Test helper: allow the next 401 to redirect again. */
export function resetUnauthorizedStateForTests(): void {
  redirecting = false;
}
