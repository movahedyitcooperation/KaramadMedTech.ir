import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only local, self-authored placeholder SVGs (public/images/placeholders,
    // components/brand) go through next/image — safe to allow.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
