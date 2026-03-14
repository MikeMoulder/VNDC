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
      className="btn-tertiary h-10 w-10 p-0"
      type="button"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export function ProofDrawer({ verdict }: { verdict: VerdictResponse }) {
  const [open, setOpen] = useState(false);
  const proof = verdict.proof.opengradient;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.02]"
        type="button"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
            <Fingerprint className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Verification Details</h3>
            <p className="mt-0.5 text-sm text-slate-400">
              Proof receipt from OpenGradient
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-white/[0.06] p-6">
              {/* Receipt ID */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-label">Receipt ID</p>
                  <p className="mt-2 truncate font-mono text-sm text-secondary">
                    {proof.receipt_id}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <CopyButton value={proof.receipt_id} />
                </div>
              </div>

              {/* Info grid */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <p className="text-label">Execution Mode</p>
                  <p className="mt-2 text-sm font-semibold text-secondary">
                    {proof.settlement_mode}
                  </p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <p className="text-label">Model Used</p>
                  <p className="mt-2 text-sm font-semibold text-secondary">
                    {proof.model}
                  </p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <p className="text-label">Timestamp</p>
                  <p className="mt-2 text-sm font-semibold text-secondary">
                    {new Date(proof.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Tool Calls */}
              {verdict.proof.tool_calls.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-label">On-Chain Calls</h4>
                  {verdict.proof.tool_calls.map((call) => (
                    <div
                      key={call.tx_hash}
                      className="rounded-xl bg-white/[0.03] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-secondary">
                            {call.tool_name}
                          </p>
                          <p className="mt-1 text-xs text-muted">{call.chain}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://basescan.org/tx/${call.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-tertiary h-10 w-10 p-0"
                            title="View on BaseScan"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <CopyButton value={call.tx_hash} />
                        </div>
                      </div>
                      <p className="mt-3 break-all font-mono text-xs text-muted">
                        {call.tx_hash}
                      </p>
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
