import type { Metadata } from "next";
import Script from "next/script";

import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "FEBAJE | Bolão da Copa 2026",
  description: "Bolão da Copa do Mundo 2026 da FEBAJE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans">
        <Script id="theme-default" strategy="beforeInteractive">
          {`
            try {
              if (localStorage.getItem("febaje-theme") !== "light") {
                document.documentElement.classList.add("dark");
              }
            } catch (_) {
              document.documentElement.classList.add("dark");
            }
          `}
        </Script>
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8 md:pb-28">{children}</main>
        </div>
      </body>
    </html>
  );
}
