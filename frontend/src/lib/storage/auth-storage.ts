const ACCESS_TOKEN_KEY =
    "hbtronics_access_token";

const REMEMBER_KEY =
    "hbtronics_remember_me";

function readToken(): string | null {
    return (
        localStorage.getItem(ACCESS_TOKEN_KEY) ??
        sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
}

export const authStorage = {
    getToken(): string | null {
        return readToken();
    },

    setToken(token: string, remember = true): void {
        // remember=false keeps the session in sessionStorage only,
        // so closing the tab signs the user out.
        if (remember) {
            localStorage.setItem(
                ACCESS_TOKEN_KEY,
                token,
            );
            localStorage.setItem(REMEMBER_KEY, "1");
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        } else {
            sessionStorage.setItem(
                ACCESS_TOKEN_KEY,
                token,
            );
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REMEMBER_KEY);
        }
    },

    clearToken(): void {
        localStorage.removeItem(
            ACCESS_TOKEN_KEY,
        );
        sessionStorage.removeItem(
            ACCESS_TOKEN_KEY,
        );
        localStorage.removeItem(REMEMBER_KEY);
    },
};