"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
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
  History,
  CheckCircle2,
} from "lucide-react";
import { RiskProfile, TimeHorizon } from "@/lib/types";

const features = [
  {
    icon: ShieldCheck,
    title: "Clear BUY / WATCH / AVOID",
    description:
      "Get a direct call with confidence and risk so you can decide faster.",
  },
  {
    icon: BarChart3,
    title: "Market facts in one view",
    description:
      "Price, liquidity, momentum, and sentiment are grouped in a single report.",
  },
  {
    icon: Radar,
    title: "Risk before hype",
    description:
      "See what could go wrong before you act, including red flags and invalidation.",
  },
  {
    icon: ScrollText,
    title: "Proof + history",
    description:
      "Each check keeps a proof receipt and is saved so you can compare over time.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect wallet (optional)",
    description: "Use wallet connect for a personalized session, or continue without it.",
  },
  {
    number: "02",
    title: "Enter token",
    description: "Paste a ticker, contract address, or DexScreener link.",
  },
  {
    number: "03",
    title: "Review the report",
    description: "Read the plan, confidence, risks, and proof details in plain language.",
  },
];

const details = [
  {
    title: "What to do",
    points: [
      "Entry zone and invalidation",
      "Take-profit targets",
      "Position sizing note",
    ],
  },
  {
    title: "What to watch",
    points: [
      "Confidence percentage",
      "Risk score (0-100)",
      "Red flags and key reasons",
    ],
  },
  {
    title: "Why this output",
    points: [
      "OpenGradient receipt ID",
      "Execution metadata",
      "On-chain tool call hashes",
    ],
  },
];

const quickTokens = ["BTC", "ETH", "SOL", "ARB"];

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
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
    <div className="relative">
      <section
        id="home"
        className="relative scroll-mt-24 overflow-hidden px-6 pb-24 pt-28 md:pb-28 md:pt-36"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-slate-500/20 blur-[120px]" />
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-teal-500/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="text-center"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/25 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-teal-400" />
              VNDC • OpenGradient-powered token research
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              Smarter token checks,
              <span className="gradient-text"> explained clearly</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              Get a fast verdict with simple reasoning, market context, and
              verifiable proof in one clean view.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#analyze"
                className="group inline-flex min-w-40 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 font-semibold transition-all hover:bg-white/15"
              >
                Analyze Token
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <Link
                href="/history"
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 px-6 py-3.5 font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              >
                <History className="h-4 w-4" />
                Past Checks
              </Link>
            </div>

            <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
              {[
                "Simple action plan",
                "Clear risk signals",
                "Proof you can verify",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-300" />
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Why use this <span className="gradient-text">tool</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              It keeps token research focused, structured, and easy to review.
            </p>
          </AnimatedSection>

          <div className="mt-16 grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <AnimatedSection key={feature.title} delay={i * 0.1}>
                <div className="glass-card-hover h-full p-7">
                  <div className="mb-5 inline-flex rounded-xl bg-white/5 p-3">
                    <feature.icon className="h-6 w-6 text-teal-300" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Three quick steps to check any token.
            </p>
          </AnimatedSection>

          <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-7">
            {steps.map((step, i) => (
              <AnimatedSection key={step.number} delay={i * 0.15}>
                <div className="glass-card relative h-full p-7 text-left">
                  <span className="mb-4 block text-5xl font-bold text-white/[0.05]">
                    {step.number}
                  </span>
                  <h3 className="-mt-5 mb-3 text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-400">{step.description}</p>
                  {i < steps.length - 1 && (
                    <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-700 lg:block">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section id="details" className="scroll-mt-24 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Report <span className="gradient-text">Breakdown</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Each report shows the plan, the risks, and the proof source.
            </p>
          </AnimatedSection>

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {details.map((item, index) => (
              <AnimatedSection key={item.title} delay={index * 0.12}>
                <div className="glass-card h-full p-7">
                  <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                  <ul className="mt-5 space-y-2.5 text-sm text-slate-400">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 leading-6">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-300" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section id="analyze" className="scroll-mt-24 px-6 pb-32 pt-12 md:pt-14">
        <div className="mx-auto max-w-2xl">
          <AnimatedSection>
            <div className="glass-card p-8 md:p-10">
              <div className="mb-9 text-center">
                <h2 className="text-2xl font-bold md:text-3xl">
                  Start a <span className="gradient-text">New Check</span>
                </h2>
                <p className="mt-3 text-sm text-slate-400">
                  Enter a ticker, contract address, or DexScreener URL
                </p>
              </div>

              <form onSubmit={submit} className="space-y-5 md:space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-4 text-base outline-none transition-all placeholder:text-slate-500 focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20"
                    placeholder="ETH, ARB, 0x..., or https://..."
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Quick picks:</span>
                  {quickTokens.map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => setQuery(token)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/[0.08]"
                    >
                      {token}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Time Horizon
                    </label>
                    <select
                      value={timeHorizon}
                      onChange={(e) =>
                        setTimeHorizon(e.target.value as TimeHorizon)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition-all focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20"
                    >
                      <option value="scalp">Short (minutes-hours)</option>
                      <option value="swing">Swing (days-weeks)</option>
                      <option value="long">Long (weeks-months)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Risk Profile
                    </label>
                    <select
                      value={riskProfile}
                      onChange={(e) =>
                        setRiskProfile(e.target.value as RiskProfile)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition-all focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20"
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
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 py-4 font-semibold transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Run Check
                </button>

                {!isConnected && (
                  <p className="text-center text-xs text-slate-500">
                    Wallet connection is optional, but helps personalize your session
                  </p>
                )}
              </form>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
