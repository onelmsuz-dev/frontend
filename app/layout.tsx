import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/seo/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // Bitta joyda — barcha bola sahifalar (landing va cluster) shundan meros
  // oladi, `app/opengraph-image.tsx` ham absolyut URL qurish uchun shuni ishlatadi.
  metadataBase: new URL(SITE_URL),
  title: "OneRoom — Smart O'quv Markaz",
  description: "O'quv markazlarni boshqarish platformasi",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `suppressHydrationWarning` — mavzu (light/dark) uchun.
    // `next-themes` sahifa chizilishidan OLDIN `<html>` ga sinf va
    // `color-scheme` qo'shadi, ya'ni server chizgan HTML mijoznikidan
    // ataylab farq qiladi. Busiz brauzer konsoli har sahifada hidratsiya
    // ogohlantirishi bilan to'lib, HAQIQIY xatolar ko'rinmay qolardi.
    <html lang="uz" suppressHydrationWarning
          className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-[var(--font-jakarta)]">
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}
