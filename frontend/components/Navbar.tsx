"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { WalletButton } from "./WalletButton";
import { ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "Flow" },
  { href: "/#details", label: "Report" },
  { href: "/#analyze", label: "Analyze" },
  { href: "/history", label: "Past Checks" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold leading-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10">
              <ShieldCheck className="h-4 w-4 text-teal-300" />
            </div>
            <div>
              <span className="gradient-text text-base">VNDC</span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`btn-tertiary ${pathname === "/history" && link.href === "/history"
                    ? "bg-white/10 text-white"
                    : ""
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <WalletButton />
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/10 px-6 py-4 md:hidden"
        >
          <div className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${pathname === "/history" && link.href === "/history"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <WalletButton />
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
