"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from "lucide-react";
import { type VerdictResponse } from "@/lib/types";
import { fetchHistory } from "@/lib/api";

function RatingIcon({ rating }: { rating: string }) {
  if (rating === "BUY") return <TrendingUp className="h-3.5 w-3.5" />;
  if (rating === "WATCH") return <Minus className="h-3.5 w-3.5" />;
  return <TrendingDown className="h-3.5 w-3.5" />;
}

function ratingStyles(rating: string) {
  if (rating === "BUY") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (rating === "WATCH") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
}

function dollars(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export default function HistoryPage() {
  const [items, setItems] = useState<VerdictResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory()
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="noise mx-auto max-w-5xl px-5 py-8 md:py-10">
      <div className="mb-10">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm font-medium text-zinc-500 transition-all hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Recent <span className="text-gradient">Verdicts</span>
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Browse previously generated token reports
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-white/[0.06] bg-surface-1 p-14 text-center"
        >
          <Clock className="mx-auto h-11 w-11 text-zinc-700" />
          <p className="mt-5 text-lg font-bold text-zinc-300">No verdicts yet</p>
          <p className="mt-2 text-sm text-zinc-500">Run an analysis to see results here</p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:brightness-110"
          >
            Run Analysis
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.article
              key={`${item.proof.opengradient.receipt_id}-${item.proof.opengradient.timestamp}-${item.token.address}-${i}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="hover-glow rounded-2xl border border-white/[0.06] bg-surface-1 p-6 transition-all hover:border-white/[0.1] md:p-7"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-black ${ratingStyles(item.verdict.rating)}`}>
                  <RatingIcon rating={item.verdict.rating} />
                  {item.verdict.rating}
                </span>
                <h3 className="text-base font-bold">
                  {item.token.name}{" "}
                  <span className="text-zinc-500">({item.token.symbol})</span>
                </h3>
                <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold text-violet-400">
                  {item.token.chain}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Confidence</p>
                  <p className="mt-1.5 text-lg font-black tabular-nums text-zinc-200">{item.verdict.confidence_pct}%</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Risk</p>
                  <p className="mt-1.5 text-lg font-black tabular-nums text-zinc-200">{item.verdict.risk_score_0_100}/100</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Price</p>
                  <p className="mt-1.5 text-lg font-black tabular-nums text-zinc-200">{dollars(item.market_snapshot.price_usd)}</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">24h</p>
                  <p className={`mt-1.5 text-lg font-black tabular-nums ${item.market_snapshot.change_24h_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {item.market_snapshot.change_24h_pct >= 0 ? "+" : ""}{item.market_snapshot.change_24h_pct.toFixed(2)}%
                  </p>
                </div>
              </div>

              <p className="mt-4 truncate text-[11px] text-zinc-600">
                Receipt: <code className="font-mono text-zinc-500">{item.proof.opengradient.receipt_id}</code>
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
