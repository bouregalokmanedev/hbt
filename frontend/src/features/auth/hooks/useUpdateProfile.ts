
import {
    useState,
} from "react";

import {
    authApi,
} from "../api/auth.api";

import type {
    User,
} from "../types/auth.types";

import type {
    UpdateProfilePayload,
} from "../api/auth.api";

import {
    useAuthStore,
} from "../store/auth.store";

interface UseUpdateProfileResult {
    updateProfile: (
        payload: UpdateProfilePayload,
    ) => Promise<User | null>;

    isUpdating: boolean;

    error: string | null;

    success: string | null;
}

export function useUpdateProfile(): UseUpdateProfileResult {
    const [isUpdating, setIsUpdating] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    const updateUser =
    useAuthStore(
        (state) => state.updateUser,
    );

    const updateProfile = async (
        payload: UpdateProfilePayload,
    ): Promise<User | null> => {
        setIsUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            const user =
    await authApi.updateProfile(payload);

updateUser(user);

setSuccess(
    "Profile updated successfully.",
);

return user;

            return user;
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                "Unable to update your profile.";

            setError(message);

            return null;
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        updateProfile,
        isUpdating,
        error,
        success,
    };
    
}
