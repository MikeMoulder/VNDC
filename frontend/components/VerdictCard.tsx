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
} from "lucide-react";
import { VerdictResponse } from "@/lib/types";
import { ProofDrawer } from "@/components/ProofDrawer";

function ratingConfig(rating: VerdictResponse["verdict"]["rating"]) {
  if (rating === "BUY")
    return {
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      icon: TrendingUp,
      glow: "shadow-emerald-500/10",
    };
  if (rating === "WATCH")
    return {
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      icon: Minus,
      glow: "shadow-amber-500/10",
    };
  return {
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    icon: TrendingDown,
    glow: "shadow-rose-500/10",
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
  return "text-rose-400";
}

function riskColor(score: number) {
  if (score <= 33) return "bg-emerald-400";
  if (score <= 66) return "bg-amber-400";
  return "bg-rose-400";
}

const stagger = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  },
  item: {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  },
};

export function VerdictCard({ verdict }: { verdict: VerdictResponse }) {
  const config = ratingConfig(verdict.verdict.rating);
  const RatingIcon = config.icon;

  return (
    <motion.article
      variants={stagger.container}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-7"
    >
      {/* Header */}
      <motion.div
        variants={stagger.item}
        className={`glass-card p-7 shadow-xl ${config.glow}`}
      >
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={`flex items-center gap-2 rounded-xl border ${config.border} ${config.bg} px-4 py-2`}
          >
            <RatingIcon className={`h-5 w-5 ${config.color}`} />
            <span className={`text-xl font-bold ${config.color}`}>
              {verdict.verdict.rating}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight">
              {verdict.token.name}{" "}
              <span className="text-slate-400">({verdict.token.symbol})</span>
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2.5 text-sm text-slate-400">
              <span>{verdict.token.chain}</span>
              <span className="font-mono text-xs">
                {verdict.token.address.slice(0, 10)}...
              </span>
              {verdict.token.links.dexscreener && (
                <a
                  href={verdict.token.links.dexscreener}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-300 hover:underline"
                >
                  DexScreener
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-7 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <div className="rounded-xl bg-white/[0.03] p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Confidence
            </p>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${confidenceColor(
                verdict.verdict.confidence_pct
              )}`}
            >
              {verdict.verdict.confidence_pct}%
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Risk Score
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {verdict.verdict.risk_score_0_100}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
              <div
                className={`h-1.5 rounded-full transition-all ${riskColor(
                  verdict.verdict.risk_score_0_100
                )}`}
                style={{ width: `${verdict.verdict.risk_score_0_100}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Price
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {dollars(verdict.market_snapshot.price_usd)}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              24h Change
            </p>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${
                verdict.market_snapshot.change_24h_pct >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {verdict.market_snapshot.change_24h_pct >= 0 ? "+" : ""}
              {verdict.market_snapshot.change_24h_pct.toFixed(2)}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Plan */}
      <motion.div variants={stagger.item} className="glass-card p-7">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-300" />
          <h3 className="text-lg font-semibold">Trade Plan</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Entry Zone
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {verdict.verdict.action_plan.entry_zone}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Invalidation
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {verdict.verdict.action_plan.invalidation}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Take Profit Targets
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {verdict.verdict.action_plan.take_profit_targets.map((tp, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-400"
                >
                  {tp}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Position Sizing
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {verdict.verdict.action_plan.position_sizing_note}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Reasons & Red Flags */}
      <div className="grid gap-7 md:grid-cols-2">
        <motion.div variants={stagger.item} className="glass-card p-7">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Why This Rating</h3>
          </div>
          <ul className="space-y-3">
            {verdict.verdict.key_reasons.map((reason, i) => (
              <li key={i} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {reason}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={stagger.item} className="glass-card p-7">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold">Red Flags</h3>
          </div>
          <ul className="space-y-3">
            {verdict.verdict.red_flags.map((flag, i) => (
              <li key={i} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {flag}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Market Snapshot */}
      <motion.div variants={stagger.item} className="glass-card p-7">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Market Data</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            {
              label: "Volume 24h",
              value: dollars(verdict.market_snapshot.volume_24h_usd),
            },
            {
              label: "Liquidity",
              value: dollars(verdict.market_snapshot.liquidity_usd),
            },
            {
              label: "Market Cap",
              value: dollars(verdict.market_snapshot.market_cap_usd),
            },
            { label: "FDV", value: dollars(verdict.market_snapshot.fdv_usd) },
            { label: "Sentiment", value: verdict.signals.sentiment },
            {
              label: "Liquidity Risk",
              value: verdict.signals.liquidity_risk,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-200">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Proof */}
      <motion.div variants={stagger.item}>
        <ProofDrawer verdict={verdict} />
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        variants={stagger.item}
        className="text-center text-xs text-slate-500"
      >
        {verdict.disclaimer}
      </motion.p>
    </motion.article>
  );
}
