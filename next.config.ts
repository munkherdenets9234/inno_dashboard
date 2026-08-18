import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB body limit. Image uploads (see
      // lib/uploads.ts) go through a Server Action too, and its own 10MB
      // client-side size check would otherwise never be reached — raised
      // past that ceiling plus multipart overhead.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
