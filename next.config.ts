import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The default bottom-left badge sits on top of the admin sidebar's account row.
  devIndicators: { position: "bottom-right" },
  images: {
    // Supabase Storage public objects (flyer covers, business logos) on share pages.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
};

export default nextConfig;
