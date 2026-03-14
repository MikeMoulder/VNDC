"use client";

import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
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
import { ArrowLeft, History, Loader2 } from "lucide-react";

function VerdictContent() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const [verdict, setVerdict] = useState<VerdictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get("query") || "ARB";
  const time_horizon = (searchParams.get("time_horizon") ||
    "swing") as TimeHorizon;
  const risk_profile = (searchParams.get("risk_profile") ||
    "balanced") as RiskProfile;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchVerdict({
          query,
          time_horizon,
          risk_profile,
          wallet_address: address,
        });
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
  }, [query, time_horizon, risk_profile, address]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-teal-400/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-400" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-teal-300" />
          </div>
          <p className="mt-6 text-lg font-medium text-slate-300">
            Checking {query}...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Gathering market data and building your report
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center backdrop-blur-xl shadow-xl shadow-rose-500/10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-lg font-semibold text-rose-400">
            Couldn&apos;t load this report
          </p>
          <p className="mt-2 text-sm text-rose-300/70">{error}</p>
          <Link
            href="/"
            className="btn-secondary mt-6"
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
      transition={{ duration: 0.5 }}
    >
      <VerdictCard verdict={verdict} />
    </motion.div>
  );
}

export default function VerdictPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:py-12">
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="btn-tertiary"
        >
          <ArrowLeft className="h-4 w-4" />
          New Search
        </Link>
        <Link
          href="/history"
          className="btn-tertiary"
        >
          <History className="h-4 w-4" />
          History
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-teal-300" />
          </div>
        }
      >
        <VerdictContent />
      </Suspense>
    </div>
  );
}
