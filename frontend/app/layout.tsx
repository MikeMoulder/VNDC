import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VNDC",
  description:
    "Get clear token verdicts, risk context, and proof receipts in one place.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans`}>
        <Providers>
          <div className="animated-grid" aria-hidden="true" />
          <Navbar />
          <main className="relative min-h-screen pt-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
