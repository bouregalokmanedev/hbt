import { api } from "./client";

const ACCESS_TOKEN_KEY = "hbtronics_access_token";

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }

        return Promise.reject(error);
    },
);