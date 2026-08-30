const ACCESS_TOKEN_KEY =
    "hbtronics_access_token";

export const authStorage = {
    getToken(): string | null {
        return localStorage.getItem(
            ACCESS_TOKEN_KEY,
        );
    },

    setToken(token: string): void {
        localStorage.setItem(
            ACCESS_TOKEN_KEY,
            token,
        );
    },

    clearToken(): void {
        localStorage.removeItem(
            ACCESS_TOKEN_KEY,
        );
    },
};