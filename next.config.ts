import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan uji coba dari HP/perangkat lain di jaringan lokal (mis. http://192.168.1.8:3000).
  // Hanya berlaku untuk `next dev`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
