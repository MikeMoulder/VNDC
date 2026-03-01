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

function ratingColor(rating: string) {
  if (rating === "BUY")
    return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  if (rating === "WATCH")
    return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  return "text-rose-400 bg-rose-400/10 border-rose-400/20";
}

function RatingIcon({ rating }: { rating: string }) {
  if (rating === "BUY") return <TrendingUp className="h-4 w-4" />;
  if (rating === "WATCH") return <Minus className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
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
    <div className="mx-auto max-w-5xl px-6 py-10 md:py-12">
      <div className="mb-10">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold">
          Recent <span className="gradient-text">Checks</span>
        </h1>
        <p className="mt-2 text-slate-400">
          Browse your previously generated token reports
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <Clock className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-lg font-medium text-slate-400">
            No checks yet
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Run a token check to see results here
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition-all hover:bg-white/15"
          >
            Run Check
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {items.map((item, i) => (
            <motion.article
              key={`${item.proof.opengradient.receipt_id}-${item.proof.opengradient.timestamp}-${item.token.address}-${i}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="glass-card-hover p-6 md:p-7"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-bold ${ratingColor(
                    item.verdict.rating
                  )}`}
                >
                  <RatingIcon rating={item.verdict.rating} />
                  {item.verdict.rating}
                </span>
                <h3 className="text-lg font-semibold tracking-tight">
                  {item.token.name}{" "}
                  <span className="text-slate-400">({item.token.symbol})</span>
                </h3>
                <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400">
                  {item.token.chain}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3.5 text-sm md:grid-cols-4">
                <div className="rounded-lg bg-white/[0.03] p-2.5">
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className="mt-0.5 font-semibold tabular-nums">
                    {item.verdict.confidence_pct}%
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2.5">
                  <p className="text-xs text-slate-500">Risk</p>
                  <p className="mt-0.5 font-semibold tabular-nums">
                    {item.verdict.risk_score_0_100}/100
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2.5">
                  <p className="text-xs text-slate-500">Price</p>
                  <p className="mt-0.5 font-semibold tabular-nums">
                    {dollars(item.market_snapshot.price_usd)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2.5">
                  <p className="text-xs text-slate-500">24h</p>
                  <p
                    className={`mt-0.5 font-semibold tabular-nums ${
                      item.market_snapshot.change_24h_pct >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {item.market_snapshot.change_24h_pct >= 0 ? "+" : ""}
                    {item.market_snapshot.change_24h_pct.toFixed(2)}%
                  </p>
                </div>
              </div>

              <p className="mt-3 truncate text-xs text-slate-500">
                Receipt:{" "}
                <code className="font-mono">
                  {item.proof.opengradient.receipt_id}
                </code>
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
