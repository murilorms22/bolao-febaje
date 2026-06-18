import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
