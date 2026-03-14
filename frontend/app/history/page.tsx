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
      <div className="mb-12">
        <Link
          href="/"
          className="btn-tertiary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-h1">
          Recent <span className="gradient-text">Checks</span>
        </h1>
        <p className="mt-3 text-body">
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
          <p className="mt-4 text-h3 text-secondary">
            No checks yet
          </p>
          <p className="mt-2 text-body">
            Run a token check to see results here
          </p>
          <Link
            href="/"
            className="btn-primary mt-8"
          >
            Run Check
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
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
                  className={`badge ${
                    item.verdict.rating === "BUY"
                      ? "badge-success"
                      : item.verdict.rating === "WATCH"
                        ? "badge-warning"
                        : "badge-danger"
                  }`}
                >
                  <RatingIcon rating={item.verdict.rating} />
                  {item.verdict.rating}
                </span>
                <h3 className="text-h3">
                  {item.token.name}{" "}
                  <span className="text-secondary">({item.token.symbol})</span>
                </h3>
                <span className="badge-primary">
                  {item.token.chain}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-label">Confidence</p>
                  <p className="mt-2 font-semibold tabular-nums text-secondary">
                    {item.verdict.confidence_pct}%
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-label">Risk</p>
                  <p className="mt-2 font-semibold tabular-nums text-secondary">
                    {item.verdict.risk_score_0_100}/100
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-label">Price</p>
                  <p className="mt-2 font-semibold tabular-nums text-secondary">
                    {dollars(item.market_snapshot.price_usd)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-label">24h</p>
                  <p
                    className={`mt-2 font-semibold tabular-nums ${
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

              <p className="mt-4 truncate text-caption">
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
