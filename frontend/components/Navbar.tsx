"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#analyze", label: "Analyze" },
  { href: "/history", label: "History" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mt-3 flex h-14 items-center justify-between rounded-2xl border border-white/[0.06] bg-surface-0/70 px-5 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="VNDC" width={28} height={28} priority className="drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
            <span className="text-[15px] font-bold tracking-tight">VNDC</span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {links.map((link) => (
              link.href.startsWith("/#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${pathname === "/history" && link.href === "/history"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-200"
                    }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${pathname === "/history" && link.href === "/history"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-200"
                    }`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/#analyze"
              className="hidden items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30 hover:brightness-110 md:inline-flex"
            >
              Get Verdict
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:text-zinc-200 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-2 overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-0/95 backdrop-blur-2xl md:hidden"
        >
          <div className="space-y-0.5 p-3">
            {links.map((link) => (
              link.href.startsWith("/#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${pathname === "/history" && link.href === "/history"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                    }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${pathname === "/history" && link.href === "/history"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                    }`}
                >
                  {link.label}
                </Link>
              )
            ))}
            <a
              href="/#analyze"
              onClick={() => setMobileOpen(false)}
              className="mt-1 block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Get Verdict
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
