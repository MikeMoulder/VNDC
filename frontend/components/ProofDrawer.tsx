"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Fingerprint,
} from "lucide-react";
import { VerdictResponse } from "@/lib/types";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-500 transition-all hover:border-violet-500/30 hover:text-zinc-300"
      type="button"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function ProofDrawer({ verdict }: { verdict: VerdictResponse }) {
  const [open, setOpen] = useState(false);
  const proof = verdict.proof.opengradient;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.01]"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10">
            <Fingerprint className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold">Verification Proof</h3>
            <p className="text-xs text-zinc-600">OpenGradient receipt &middot; on-chain verifiable</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-zinc-600" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-white/[0.04] p-6">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Receipt ID</p>
                  <p className="mt-1.5 truncate font-mono text-sm text-zinc-300">{proof.receipt_id}</p>
                </div>
                <div className="ml-3 shrink-0">
                  <CopyButton value={proof.receipt_id} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Settlement</p>
                  <p className="mt-1.5 text-sm font-bold text-zinc-200">{proof.settlement_mode}</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Model</p>
                  <p className="mt-1.5 text-sm font-bold text-zinc-200">{proof.model}</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Timestamp</p>
                  <p className="mt-1.5 text-sm font-bold text-zinc-200">{new Date(proof.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {verdict.proof.tool_calls.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">On-Chain Calls</p>
                  {verdict.proof.tool_calls.map((call) => (
                    <div key={call.tx_hash} className="rounded-xl border border-white/[0.04] bg-surface-0/60 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-zinc-200">{call.tool_name}</p>
                          <p className="mt-0.5 text-xs text-zinc-600">{call.chain}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://basescan.org/tx/${call.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-500 transition-all hover:border-violet-500/30 hover:text-zinc-300"
                            title="View on BaseScan"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <CopyButton value={call.tx_hash} />
                        </div>
                      </div>
                      <p className="mt-2 break-all font-mono text-[11px] text-zinc-600">{call.tx_hash}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
