"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { AnimatedSection } from "@/components/AnimatedSection";
import {
  ShieldCheck,
  BarChart3,
  Radar,
  ScrollText,
  ArrowRight,
  Search,
  Clock,
  Zap,
  Lock,
  Activity,
} from "lucide-react";
import { RiskProfile, TimeHorizon } from "@/lib/types";

const quickTokens = ["BTC", "ETH", "SOL", "ARB"];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("swing");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({
      query: query.trim(),
      time_horizon: timeHorizon,
      risk_profile: riskProfile,
    });
    router.push(`/verdict?${params.toString()}`);
  }

  return (
    <div className="noise relative">
      {/* ============ HERO ============ */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-violet-600/[0.07] blur-[150px] animate-glow-pulse" />
          <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-indigo-600/[0.05] blur-[150px] animate-glow-pulse [animation-delay:1.5s]" />
          <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/[0.04] blur-[150px]" />
        </div>

        {/* Dot grid overlay */}
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-60" />

        {/* Radial fade at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06060a] to-transparent" />

        <div className="relative mx-auto max-w-5xl px-5 pb-32 pt-36 md:pt-44">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
              <div className="relative flex h-5 w-5 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/30" />
                <div className="relative h-2 w-2 rounded-full bg-violet-400" />
              </div>
              <span className="text-xs font-medium text-zinc-400">
                Verifiable verdicts powered by OpenGradient
              </span>
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              <span className="block">Know before</span>
              <span className="text-gradient">you trade.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              AI-generated token verdicts with cryptographic proof.
              Entry zones, risk scores, and red flags, verifiable on-chain.
            </p>

            {/* CTA row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#analyze"
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-2xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
              >
                <Zap className="h-4 w-4" />
                Analyze Token
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-3.5 text-sm font-medium text-zinc-400 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:text-zinc-200"
              >
                <Clock className="h-4 w-4" />
                Past Verdicts
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { icon: Lock, label: "Cryptographic proof" },
                { icon: Activity, label: "Real-time data" },
                { icon: ShieldCheck, label: "Risk-first analysis" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-3 text-xs font-medium text-zinc-500"
                >
                  <item.icon className="h-3.5 w-3.5 text-violet-400/60" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ BENTO FEATURE GRID ============ */}
      <section id="features" className="scroll-mt-24 px-5 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="mb-16 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">
              What you get
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
              One report. <span className="text-gradient">Full picture.</span>
            </h2>
          </AnimatedSection>

          <div className="grid gap-3 md:grid-cols-6">
            {/* Large card - verdicts */}
            <AnimatedSection className="md:col-span-4" delay={0}>
              <div className="hover-glow group h-full rounded-2xl border border-white/[0.06] bg-surface-1 p-8 transition-all hover:border-white/[0.1]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10">
                  <ShieldCheck className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Clear Verdicts</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                  Instant BUY, WATCH, or AVOID calls. Each comes with a confidence score,
                  risk score, entry zone, invalidation level, and take-profit targets.
                </p>
                <div className="mt-6 flex gap-2">
                  {["BUY", "WATCH", "AVOID"].map((r) => (
                    <span
                      key={r}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${r === "BUY"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : r === "WATCH"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Small card - risk */}
            <AnimatedSection className="md:col-span-2" delay={0.08}>
              <div className="hover-glow group h-full rounded-2xl border border-white/[0.06] bg-surface-1 p-7 transition-all hover:border-white/[0.1]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/10">
                  <Radar className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Risk Radar</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Red flags and invalidation triggers surfaced before you commit capital.
                </p>
              </div>
            </AnimatedSection>

            {/* Small card - market data */}
            <AnimatedSection className="md:col-span-2" delay={0.12}>
              <div className="hover-glow group h-full rounded-2xl border border-white/[0.06] bg-surface-1 p-7 transition-all hover:border-white/[0.1]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Market Intel</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Price, volume, liquidity, FDV and sentiment in one structured view.
                </p>
              </div>
            </AnimatedSection>

            {/* Large card - proof */}
            <AnimatedSection className="md:col-span-4" delay={0.16}>
              <div className="hover-glow group h-full rounded-2xl border border-white/[0.06] bg-surface-1 p-8 transition-all hover:border-white/[0.1]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                  <ScrollText className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Verifiable Proof</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                  Every verdict ships with an OpenGradient receipt ID, execution metadata,
                  and on-chain tool call hashes. Don&apos;t trust — verify.
                </p>
                <div className="mt-6 overflow-hidden rounded-lg border border-white/[0.04] bg-surface-0/50 p-3">
                  <p className="truncate font-mono text-[11px] text-zinc-600">
                    receipt: 0x7a3b...f92e &middot; model: GPT-4.1 &middot; settlement: SETTLE_BATCH
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="scroll-mt-24 px-5 py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="mb-16 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">
              Process
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
              Three steps. <span className="text-gradient">Zero guesswork.</span>
            </h2>
          </AnimatedSection>

          <div className="relative grid gap-4 md:grid-cols-3">
            {/* Connecting line */}
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent md:block" />

            {[
              { n: "01", title: "Enter a token", desc: "Paste a ticker, address, or DexScreener URL." },
              { n: "02", title: "Set parameters", desc: "Choose time horizon and risk tolerance." },
              { n: "03", title: "Get your verdict", desc: "Review signals, plan, and proof receipt." },
            ].map((step, i) => (
              <AnimatedSection key={step.n} delay={i * 0.1}>
                <div className="hover-glow relative rounded-2xl border border-white/[0.06] bg-surface-1 p-7 transition-all hover:border-white/[0.1]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10">
                    <span className="font-mono text-sm font-bold text-violet-400">{step.n}</span>
                  </div>
                  <h3 className="text-[15px] font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ANALYZE FORM ============ */}
      <section id="analyze" className="scroll-mt-24 px-5 pb-32 pt-8 md:pt-12">
        <div className="mx-auto max-w-xl">
          <AnimatedSection>
            <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-7 md:p-9">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10">
                  <Search className="h-5 w-5 text-violet-400" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                  Run Analysis
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Enter a ticker, contract address, or DexScreener URL
                </p>
              </div>

              <form onSubmit={submit} className="space-y-5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.06] bg-surface-0 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-violet-500/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                    placeholder="ETH, ARB, 0x..., or paste a URL"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-zinc-600">Quick:</span>
                  {quickTokens.map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => setQuery(token)}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-zinc-500 transition-all hover:border-violet-500/30 hover:text-zinc-300"
                    >
                      {token}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                      Time Horizon
                    </label>
                    <select
                      value={timeHorizon}
                      onChange={(e) => setTimeHorizon(e.target.value as TimeHorizon)}
                      className="w-full rounded-xl border border-white/[0.06] bg-surface-0 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-violet-500/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                    >
                      <option value="scalp">Short (min-hours)</option>
                      <option value="swing">Swing (days-weeks)</option>
                      <option value="long">Long (weeks-months)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                      Risk Profile
                    </label>
                    <select
                      value={riskProfile}
                      onChange={(e) => setRiskProfile(e.target.value as RiskProfile)}
                      className="w-full rounded-xl border border-white/[0.06] bg-surface-0 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-violet-500/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="balanced">Balanced</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="group w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                >
                  Generate Verdict
                </button>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
