"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fetchVerdict } from "@/lib/api";
import { VerdictCard } from "@/components/VerdictCard";
import {
  type VerdictResponse,
  type TimeHorizon,
  type RiskProfile,
} from "@/lib/types";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";

function VerdictContent() {
  const searchParams = useSearchParams();
  const [verdict, setVerdict] = useState<VerdictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get("query") || "ARB";
  const time_horizon = (searchParams.get("time_horizon") || "swing") as TimeHorizon;
  const risk_profile = (searchParams.get("risk_profile") || "balanced") as RiskProfile;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchVerdict({ query, time_horizon, risk_profile });
        if (!cancelled) setVerdict(result);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, time_horizon, risk_profile]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="relative mx-auto h-16 w-16">
            {/* Outer pulsing ring */}
            <div className="pulse-ring absolute inset-0 rounded-full border border-violet-500/30" />
            {/* Spinner */}
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
            <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-violet-400" />
          </div>
          <p className="mt-6 text-lg font-bold text-zinc-100">
            Analyzing <span className="text-gradient">{query}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Gathering market data and generating your report...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg"
      >
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
            <span className="text-xl font-black text-red-400">!</span>
          </div>
          <p className="text-lg font-bold text-red-400">Report Failed</p>
          <p className="mt-2 text-sm text-red-300/50">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Try Again
          </Link>
        </div>
      </motion.div>
    );
  }

  if (!verdict) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <VerdictCard verdict={verdict} />
    </motion.div>
  );
}

export default function VerdictPage() {
  return (
    <div className="noise mx-auto max-w-5xl px-5 py-8 md:py-10">
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm font-medium text-zinc-500 transition-all hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          New Search
        </Link>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm font-medium text-zinc-500 transition-all hover:text-zinc-200"
        >
          <Clock className="h-3.5 w-3.5" />
          History
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        }
      >
        <VerdictContent />
      </Suspense>
    </div>
  );
}
