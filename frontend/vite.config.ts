import { defineConfig } from "vitest/config";
import { loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/**
 * Inject a Content-Security-Policy into production builds.
 *
 * The access token is kept in browser storage (see docs/security.md), so the
 * main remaining XSS mitigation is preventing injected scripts from running
 * at all. The policy is only added at build time: Vite's dev server injects
 * inline scripts for HMR and would be blocked by it.
 */
function cspPlugin(apiOrigin: string | null): Plugin {
    const connectSrc = [
        "'self'",
        apiOrigin,
        "https://api.stripe.com",
        "https://challenges.cloudflare.com",
    ]
        .filter((source): source is string => Boolean(source))
        .join(" ");

    const policy = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "script-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
        // Tailwind and a few inline style props require this; scripts stay locked down.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob: https:",
        "font-src 'self' data:",
        `connect-src ${connectSrc}`,
        "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
        "worker-src 'self' blob:",
        "form-action 'self'",
    ].join("; ");

    return {
        name: "hbt-content-security-policy",
        apply: "build",
        transformIndexHtml(html) {
            return html.replace(
                "</head>",
                `    <meta http-equiv="Content-Security-Policy" content="${policy}">\n  </head>`,
            );
        },
    };
}

function apiOrigin(apiUrl: string | undefined): string | null {
    if (!apiUrl) return null;

    try {
        return new URL(apiUrl).origin;
    } catch {
        return null;
    }
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");

    return {
        plugins: [
            react(),
            tailwindcss(),
            cspPlugin(apiOrigin(env.VITE_API_URL)),
        ],

        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },

        test: {
            environment: "jsdom",
            setupFiles: ["./src/test/setup.ts"],
            globals: true,
            include: ["src/**/*.{test,spec}.{ts,tsx}"],
            coverage: {
                provider: "v8",
                reporter: ["text-summary"],
                // Floor set just below the measured baseline (2026-10):
                // 58.35 statements / 48.78 branches / 51.76 functions /
                // 62.46 lines. Raise as coverage improves; never lower it
                // to make a red build green.
                thresholds: {
                    statements: 55,
                    branches: 45,
                    functions: 48,
                    lines: 60,
                },
            },
        },
    };
});
