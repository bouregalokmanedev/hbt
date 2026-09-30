import { useDeferredValue, useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { adminApi } from "../api/adminApi";

export const USERS_PAGE_SIZE = 12;

export type UserAction =
    | { action: "verify" | "unverify" | "suspend" | "activate"; id: string }
    | { action: "status"; id: string; status: string }
    | { action: "role"; id: string; role: string };

const FILTER_KEYS = ["search", "role", "status"] as const;

function runAction(input: UserAction) {
    switch (input.action) {
        case "role":
            return adminApi.setRole(input.id, input.role);
        case "status":
            return adminApi.setUserStatus(input.id, input.status);
        case "verify":
            return adminApi.verifyUser(input.id);
        case "unverify":
            return adminApi.unverifyUser(input.id);
        case "suspend":
            return adminApi.suspendUser(input.id);
        default:
            return adminApi.activateUser(input.id);
    }
}

/**
 * Single source of truth for the People page: filter state lives in the URL
 * (so admin links such as /admin/users?search=… are shareable), the list is
 * one query, and every row action goes through one mutation.
 */
export function useAdminUsers() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [actionError, setActionError] = useState("");

    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "";
    const status = searchParams.get("status") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const deferredSearch = useDeferredValue(search);

    const setFilters = useCallback(
        (patch: Partial<Record<(typeof FILTER_KEYS)[number] | "page", string>>) => {
            setSearchParams(
                (previous) => {
                    const next = new URLSearchParams(previous);
                    Object.entries(patch).forEach(([key, value]) => {
                        if (value) next.set(key, value);
                        else next.delete(key);
                    });
                    if (!("page" in patch)) next.delete("page");
                    return next;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    const clearFilters = useCallback(
        () => setFilters({ search: "", role: "", status: "" }),
        [setFilters],
    );

    const users = useQuery({
        queryKey: ["admin", "users", deferredSearch, role, status, page],
        queryFn: () =>
            adminApi.users({
                search: deferredSearch,
                role,
                status,
                page,
                per_page: USERS_PAGE_SIZE,
            }),
        placeholderData: (previous) => previous,
    });

    const mutation = useMutation({
        mutationFn: runAction,
        onSuccess: () => {
            setActionError("");
            void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: (error: Error) => setActionError(error.message),
    });

    const run = useCallback(
        (action: UserAction) => {
            if (mutation.isPending) return;
            mutation.mutate(action);
        },
        [mutation],
    );

    return {
        users,
        filters: { search, role, status, page },
        hasFilters: Boolean(search || role || status),
        setFilters,
        clearFilters,
        run,
        isPending: mutation.isPending,
        actionError,
        refetch: () => void users.refetch(),
        isFetching: users.isFetching,
    };
}
