import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950/70">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-white/10">
              <ShieldCheck className="h-3 w-3 text-teal-300" />
            </div>
            <span className="text-sm font-semibold text-slate-300">
              VNDC
            </span>
          </div>

          <p className="text-center text-xs leading-relaxed text-slate-500 md:text-left">
            Built on OpenGradient &middot; For research only &mdash; not
            financial advice.
          </p>

          <div className="flex gap-4 text-xs text-slate-500">
            <a
              href="https://opengradient.ai"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-slate-300"
            >
              OpenGradient
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-slate-300"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
