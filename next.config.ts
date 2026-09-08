import type { NextConfig } from "next";

// Browser-facing backend origin — needed for admin-uploaded product images
// (served at /api/v1/uploads/* by the backend), which resolve against a
// *different* origin than the server-only, sometimes-loopback API_BASE_URL.
// See lib/api/mappers.ts's resolveImageUrl for the matching runtime logic.
const backendPublicOrigin = process.env.BACKEND_PUBLIC_ORIGIN ?? "http://localhost:8000";
const backendUrl = new URL(backendPublicOrigin);

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP second, original last. AVIF typically saves another
    // 20-30% over WebP on photographs; the optimizer only spends the encode
    // on widths that are actually requested, and caches the result.
    formats: ["image/avif", "image/webp"],
    // Next 16 pins the optimizer to quality 75 unless the allowed values are
    // listed here, and a request for anything else is rejected outright. 75
    // stays the default every product image uses; 90 exists for the hero,
    // which is the one full-bleed photograph on the site — at 75 it landed
    // at 0.11 bits/px, low enough to smear the fine detail in a clinic
    // photo. See components/shop/HeroSlider.tsx.
    qualities: [75, 90],
    // Only local, self-authored placeholder SVGs (public/images/placeholders,
    // components/brand) go through next/image — safe to allow.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: backendUrl.protocol.replace(":", "") as "http" | "https",
        hostname: backendUrl.hostname,
        port: backendUrl.port || undefined,
        pathname: "/api/v1/uploads/**",
      },
    ],
    // The image optimizer refuses by default to fetch from a hostname that
    // resolves to a private/local IP (an SSRF guard). BACKEND_PUBLIC_ORIGIN
    // defaults to http://localhost:8000 in dev, which trips that guard even
    // though the single remotePattern above is already scoped to our own
    // backend's upload path — not user input, so there's nothing to smuggle
    // an internal-network fetch through. Safe to allow here.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
