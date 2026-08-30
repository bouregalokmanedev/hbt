import axios from "axios";

import { env } from "@/config/env";

export const api = axios.create({
    baseURL: env.apiUrl,
    timeout: 30_000,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});