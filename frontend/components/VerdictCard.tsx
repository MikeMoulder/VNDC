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
        className="glass-card-elevated p-8"
      >
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={`badge ${
              verdict.verdict.rating === "BUY"
                ? "badge-success"
                : verdict.verdict.rating === "WATCH"
                  ? "badge-warning"
                  : "badge-danger"
            }`}
          >
            <RatingIcon className="h-5 w-5" />
            <span className="text-lg font-bold">
              {verdict.verdict.rating}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-h2 md:text-h1">
              {verdict.token.name}{" "}
              <span className="text-secondary">({verdict.token.symbol})</span>
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2.5 text-sm text-secondary">
              <span>{verdict.token.chain}</span>
              <span className="font-mono text-xs text-muted">
                {verdict.token.address.slice(0, 10)}...
              </span>
              {verdict.token.links.dexscreener && (
                <a
                  href={verdict.token.links.dexscreener}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-300 hover:text-teal-200 transition-colors"
                >
                  DexScreener
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-label">Confidence</p>
            <p
              className={`mt-2 text-2xl font-bold tabular-nums ${confidenceColor(
                verdict.verdict.confidence_pct
              )}`}
            >
              {verdict.verdict.confidence_pct}%
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-label">Risk Score</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {verdict.verdict.risk_score_0_100}
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-white/10">
              <div
                className={`h-2 rounded-full transition-all ${riskColor(
                  verdict.verdict.risk_score_0_100
                )}`}
                style={{ width: `${verdict.verdict.risk_score_0_100}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-label">Price</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {dollars(verdict.market_snapshot.price_usd)}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="text-label">24h Change</p>
            <p
              className={`mt-2 text-2xl font-bold tabular-nums ${
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
      <motion.div variants={stagger.item} className="glass-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-400/10">
            <Target className="h-5 w-5 text-teal-300" />
          </div>
          <h3 className="text-h3">Trade Plan</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white/[0.03] p-5">
            <p className="text-label">Entry Zone</p>
            <p className="mt-3 text-body">
              {verdict.verdict.action_plan.entry_zone}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-5">
            <p className="text-label">Invalidation</p>
            <p className="mt-3 text-body">
              {verdict.verdict.action_plan.invalidation}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-5">
            <p className="text-label">Take Profit Targets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {verdict.verdict.action_plan.take_profit_targets.map((tp, i) => (
                <span
                  key={i}
                  className="badge-success"
                >
                  {tp}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-5">
            <p className="text-label">Position Sizing</p>
            <p className="mt-3 text-body">
              {verdict.verdict.action_plan.position_sizing_note}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Reasons & Red Flags */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={stagger.item} className="glass-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-h3">Why This Rating</h3>
          </div>
          <ul className="space-y-4">
            {verdict.verdict.key_reasons.map((reason, i) => (
              <li key={i} className="flex gap-3 text-body leading-relaxed">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                {reason}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={stagger.item} className="glass-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-h3">Red Flags</h3>
          </div>
          <ul className="space-y-4">
            {verdict.verdict.red_flags.map((flag, i) => (
              <li key={i} className="flex gap-3 text-body leading-relaxed">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                {flag}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Market Snapshot */}
      <motion.div variants={stagger.item} className="glass-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="text-h3">Market Data</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
            <div key={item.label} className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-label">{item.label}</p>
              <p className="mt-2 text-sm font-semibold capitalize text-secondary">
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
        className="text-center text-caption"
      >
        {verdict.disclaimer}
      </motion.p>
    </motion.article>
  );
}
