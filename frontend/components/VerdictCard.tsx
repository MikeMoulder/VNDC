"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { VerdictResponse } from "@/lib/types";
import { ProofDrawer } from "@/components/ProofDrawer";

function ratingConfig(rating: VerdictResponse["verdict"]["rating"]) {
  if (rating === "BUY")
    return {
      color: "text-emerald-400",
      bg: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/10",
      icon: TrendingUp,
      label: "BUY",
    };
  if (rating === "WATCH")
    return {
      color: "text-amber-400",
      bg: "from-amber-500/20 to-amber-500/5",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/10",
      icon: Minus,
      label: "WATCH",
    };
  return {
    color: "text-red-400",
    bg: "from-red-500/20 to-red-500/5",
    border: "border-red-500/20",
    glow: "shadow-red-500/10",
    icon: TrendingDown,
    label: "AVOID",
  };
}

function dollars(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

function confidenceColor(pct: number) {
  if (pct >= 75) return "text-emerald-400";
  if (pct >= 50) return "text-amber-400";
  return "text-red-400";
}

function riskBarColor(score: number) {
  if (score <= 33) return "bg-emerald-500";
  if (score <= 66) return "bg-amber-500";
  return "bg-red-500";
}

const stagger = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  },
  item: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
  },
};

export function VerdictCard({ verdict }: { verdict: VerdictResponse }) {
  const config = ratingConfig(verdict.verdict.rating);
  const RatingIcon = config.icon;
  const positive = verdict.market_snapshot.change_24h_pct >= 0;

  return (
    <motion.article
      variants={stagger.container}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* ===== HEADER CARD ===== */}
      <motion.div
        variants={stagger.item}
        className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-1 p-7 shadow-2xl ${config.glow} md:p-8`}
      >
        {/* Ambient glow behind rating */}
        <div className={`pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gradient-to-br ${config.bg} blur-[100px] opacity-40`} />

        <div className="relative flex flex-wrap items-start gap-4">
          {/* Rating badge */}
          <div className={`flex items-center gap-2 rounded-xl border bg-gradient-to-r px-4 py-2 ${config.bg} ${config.border}`}>
            <RatingIcon className={`h-5 w-5 ${config.color}`} />
            <span className={`text-lg font-black ${config.color}`}>{config.label}</span>
          </div>

          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              {verdict.token.name}{" "}
              <span className="text-zinc-500">({verdict.token.symbol})</span>
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2.5 text-sm">
              <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-medium capitalize text-zinc-400">
                {verdict.token.chain}
              </span>
              <span className="font-mono text-xs text-zinc-600">
                {verdict.token.address.slice(0, 10)}...
              </span>
              {verdict.token.links.dexscreener && (
                <a
                  href={verdict.token.links.dexscreener}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 transition-colors hover:text-violet-300"
                >
                  DexScreener
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Confidence</p>
            <p className={`mt-2 text-3xl font-black tabular-nums ${confidenceColor(verdict.verdict.confidence_pct)}`}>
              {verdict.verdict.confidence_pct}
              <span className="text-lg">%</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Risk</p>
            <p className="mt-2 text-3xl font-black tabular-nums">
              {verdict.verdict.risk_score_0_100}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className={`h-full rounded-full transition-all ${riskBarColor(verdict.verdict.risk_score_0_100)}`}
                style={{ width: `${verdict.verdict.risk_score_0_100}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Price</p>
            <p className="mt-2 text-3xl font-black tabular-nums">
              {dollars(verdict.market_snapshot.price_usd)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">24h</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <p className={`text-3xl font-black tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {positive ? "+" : ""}{verdict.market_snapshot.change_24h_pct.toFixed(2)}%
              </p>
              {positive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== ACTION PLAN ===== */}
      <motion.div variants={stagger.item} className="rounded-2xl border border-white/[0.06] bg-surface-1 p-7 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10">
            <Target className="h-5 w-5 text-violet-400" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Trade Plan</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Entry Zone</p>
            <p className="mt-2.5 text-sm font-medium text-zinc-200">{verdict.verdict.action_plan.entry_zone}</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Invalidation</p>
            <p className="mt-2.5 text-sm font-medium text-zinc-200">{verdict.verdict.action_plan.invalidation}</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Take Profit</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {verdict.verdict.action_plan.take_profit_targets.map((tp, i) => (
                <span key={i} className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  {tp}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Position Note</p>
            <p className="mt-2.5 text-sm font-medium text-zinc-200">{verdict.verdict.action_plan.position_sizing_note}</p>
          </div>
        </div>
      </motion.div>

      {/* ===== REASONS & FLAGS ===== */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={stagger.item} className="rounded-2xl border border-white/[0.06] bg-surface-1 p-7 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Bull Case</h3>
          </div>
          <ul className="space-y-3.5">
            {verdict.verdict.key_reasons.map((reason, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {reason}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={stagger.item} className="rounded-2xl border border-white/[0.06] bg-surface-1 p-7 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Red Flags</h3>
          </div>
          <ul className="space-y-3.5">
            {verdict.verdict.red_flags.map((flag, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {flag}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ===== MARKET DATA ===== */}
      <motion.div variants={stagger.item} className="rounded-2xl border border-white/[0.06] bg-surface-1 p-7 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Market Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: "Volume 24h", value: dollars(verdict.market_snapshot.volume_24h_usd) },
            { label: "Liquidity", value: dollars(verdict.market_snapshot.liquidity_usd) },
            { label: "Market Cap", value: dollars(verdict.market_snapshot.market_cap_usd) },
            { label: "FDV", value: dollars(verdict.market_snapshot.fdv_usd) },
            { label: "Sentiment", value: verdict.signals.sentiment },
            { label: "Liquidity Risk", value: verdict.signals.liquidity_risk },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">{item.label}</p>
              <p className="mt-2 text-sm font-bold capitalize text-zinc-200">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ===== PROOF ===== */}
      <motion.div variants={stagger.item}>
        <ProofDrawer verdict={verdict} />
      </motion.div>

      {/* Disclaimer */}
      <motion.p variants={stagger.item} className="text-center text-xs text-zinc-600">
        {verdict.disclaimer}
      </motion.p>
    </motion.article>
  );
}
