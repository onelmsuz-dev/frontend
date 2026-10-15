import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // React ViewTransition'ni App Router navigatsiyalari bilan bog'laydi.
  experimental: {
    viewTransition: true,
  },
  // Faqat DEV rejimi: sahifa `127.0.0.1` orqali ochilsa, Next.js `/_next/*` dev
  // resurslarini bloklaydi va sahifa "jonlanmaydi" (tugmalar bosilmaydi, JS
  // ishlamaydi). `localhost` bunga tegmaydi. Productionga ta'siri yo'q.
  // `*.app.localhost` — markaz subdomenini lokalda sinash (demo.app.localhost:3000).
  allowedDevOrigins: ["127.0.0.1", "*.app.localhost"],
  // Bir nechta lockfile bo'lgani uchun turbopack root'ni aniq belgilaymiz.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
