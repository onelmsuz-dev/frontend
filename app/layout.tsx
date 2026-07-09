import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "OneRoom — Smart O'quv Markaz",
  description: "O'quv markazlarni boshqarish platformasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-[var(--font-jakarta)]">
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}
