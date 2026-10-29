import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authStorage } from "@/lib/storage/auth-storage";

import {
    SESSION_EXPIRED_EVENT,
    handleUnauthorizedResponse,
    resetUnauthorizedStateForTests,
} from "./unauthorized";

describe("handleUnauthorizedResponse", () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        resetUnauthorizedStateForTests();
    });

    afterEach(() => {
        resetUnauthorizedStateForTests();
        vi.restoreAllMocks();
    });

    it("ignores responses that are not 401", () => {
        const redirect = vi.fn();
        const listener = vi.fn();

        authStorage.setToken("still-valid");
        window.addEventListener(SESSION_EXPIRED_EVENT, listener);

        handleUnauthorizedResponse(403, true, {
            pathname: "/dashboard",
            redirect,
        });

        expect(authStorage.getToken()).toBe("still-valid");
        expect(redirect).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();

        window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    });

    it("clears the stored token and notifies the auth store on expiry", () => {
        const listener = vi.fn();

        authStorage.setToken("expired-token");
        window.addEventListener(SESSION_EXPIRED_EVENT, listener);

        handleUnauthorizedResponse(401, true, {
            pathname: "/courses",
            redirect: vi.fn(),
        });

        expect(authStorage.getToken()).toBeNull();
        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    });

    it("redirects to login once and preserves the current location", () => {
        const redirect = vi.fn();

        authStorage.setToken("expired-token");

        handleUnauthorizedResponse(401, true, {
            pathname: "/courses/42",
            search: "?tab=lessons",
            redirect,
        });

        expect(redirect).toHaveBeenCalledTimes(1);
        expect(redirect).toHaveBeenCalledWith(
            `/login?next=${encodeURIComponent("/courses/42?tab=lessons")}`,
        );
    });

    it("redirects only once when parallel requests fail together", () => {
        const redirect = vi.fn();

        authStorage.setToken("expired-token");

        handleUnauthorizedResponse(401, true, {
            pathname: "/dashboard",
            redirect,
        });
        handleUnauthorizedResponse(401, true, {
            pathname: "/dashboard",
            redirect,
        });
        handleUnauthorizedResponse(401, true, {
            pathname: "/dashboard",
            redirect,
        });

        expect(redirect).toHaveBeenCalledTimes(1);
    });

    it("does not redirect away from auth pages", () => {
        const redirect = vi.fn();

        authStorage.setToken("expired-token");

        for (const pathname of [
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/auth/google/callback",
        ]) {
            resetUnauthorizedStateForTests();
            handleUnauthorizedResponse(401, true, { pathname, redirect });
        }

        expect(redirect).not.toHaveBeenCalled();
    });

    it("treats a rejected login with no token as a form error", () => {
        const redirect = vi.fn();
        const listener = vi.fn();

        window.addEventListener(SESSION_EXPIRED_EVENT, listener);

        handleUnauthorizedResponse(401, false, {
            pathname: "/login",
            redirect,
        });

        expect(redirect).not.toHaveBeenCalled();
        // The store is still told, so a stale in-memory user is dropped.
        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    });
});
