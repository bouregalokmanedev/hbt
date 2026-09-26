import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // All assets are local; no remote patterns.
    unoptimized: false,
  },
  eslint: {
    // Boundary rules live in .eslintrc.cjs; do not block builds on lint here.
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
