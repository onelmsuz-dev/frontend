import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Bir nechta lockfile bo'lgani uchun turbopack root'ni aniq belgilaymiz.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
