"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowConnectors(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && address) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="btn-secondary gap-2.5"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{truncateAddress(address)}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl"
            >
              <div className="border-b border-white/5 p-4">
                <p className="text-label">Connected</p>
                <p className="mt-2 font-mono text-sm text-secondary">{truncateAddress(address)}</p>
              </div>
              <div className="space-y-2 p-2">
                <button
                  onClick={copyAddress}
                  className="btn-tertiary w-full justify-start text-secondary hover:text-white"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Address"}
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setShowDropdown(false);
                  }}
                  className="btn-danger w-full justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        className="btn-primary gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </button>

      <AnimatePresence>
        {showConnectors && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl"
          >
            <div className="border-b border-white/5 p-4">
              <p className="font-semibold text-white">Connect Wallet</p>
              <p className="mt-1 text-sm text-slate-400">
                Choose your preferred wallet
              </p>
            </div>
            <div className="space-y-2 p-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowConnectors(false);
                  }}
                  className="btn-tertiary w-full justify-start gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <Wallet className="h-4 w-4" />
                  </div>
                  {connector.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
