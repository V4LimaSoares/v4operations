import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        // Applies to every response — no security headers were set at all before this.
        source: "/:path*",
        headers: [
          // Nothing in this app is meant to be framed by another site — blocks clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from guessing content-types (e.g. treating an uploaded file as HTML/JS).
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No feature here uses the camera/mic/location/payment APIs — deny them outright.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
