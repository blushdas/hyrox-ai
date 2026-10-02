import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development" && process.env.CAPACITOR_BUILD !== "1") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  ...(process.env.CAPACITOR_BUILD === "1"
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : { async headers() { return [{ source: "/:path*", headers: securityHeaders }]; } }),
};

export default nextConfig;
