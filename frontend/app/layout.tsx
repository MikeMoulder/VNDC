import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "VNDC",
  description:
    "Get clear token verdicts, risk context, and proof receipts in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-[77px]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
