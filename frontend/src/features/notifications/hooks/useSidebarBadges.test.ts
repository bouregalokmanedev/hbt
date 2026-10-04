import { describe, expect, it } from "vitest";

import { getCategoryForPath } from "./useSidebarBadges";

/**
 * Every value here must exist in the backend's CATEGORIES list —
 * `StudentNotificationController::markCategoryRead` rejects anything else with
 * a 422, so a wrong mapping silently breaks "mark all as read" for that screen.
 */
describe("getCategoryForPath", () => {
    it("keeps the original exact matches working", () => {
        expect(getCategoryForPath("/dashboard")).toBe("dashboard");
        expect(getCategoryForPath("/messages")).toBe("messages");
        expect(getCategoryForPath("/support-desk/messages")).toBe("messages");
        expect(getCategoryForPath("/support-desk/announcements")).toBe("announcements");
    });

    it("maps every Staff Hub tab to its badge", () => {
        for (const role of ["admin", "support-desk", "instructor"]) {
            expect(getCategoryForPath(`/${role}/staff-hub/news`)).toBe("announcements");
            expect(getCategoryForPath(`/${role}/staff-hub/room`)).toBe("messages");
            expect(getCategoryForPath(`/${role}/staff-hub`)).toBeNull();
        }
    });

    it("maps the per-role inboxes that had no entry before", () => {
        expect(getCategoryForPath("/admin/messages")).toBe("messages");
        expect(getCategoryForPath("/admin/messages/announcements")).toBe("announcements");
        expect(getCategoryForPath("/instructor/messages")).toBe("messages");
        expect(getCategoryForPath("/instructor/announcements")).toBe("announcements");
    });

    it("prefers the more specific prefix", () => {
        expect(getCategoryForPath("/admin/messages/announcements")).not.toBe("messages");
    });

    it("never invents a category for unknown or adjacent paths", () => {
        expect(getCategoryForPath("/")).toBeNull();
        expect(getCategoryForPath("/admin")).toBeNull();
        expect(getCategoryForPath("/admin/staff")).toBeNull();
        expect(getCategoryForPath("/messages-old")).toBeNull();
        expect(getCategoryForPath("/instructor/messages-archive")).toBeNull();
    });
});
