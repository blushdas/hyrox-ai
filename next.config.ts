import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development" && process.env.CAPACITOR_BUILD !== "1") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  ...(process.env.CAPACITOR_BUILD === "1"
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
