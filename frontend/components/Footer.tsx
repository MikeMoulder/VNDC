import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative mt-20">
      <div className="mx-auto h-px max-w-2xl bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-10 md:flex-row">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="VNDC" width={28} height={28} className="drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
          <span className="text-sm font-semibold text-zinc-500">VNDC</span>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-zinc-600">
          Built on{" "}
          <a
            href="https://opengradient.ai"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-300"
          >
            OpenGradient
          </a>{" "}
        </p>

        <a
          href="https://github.com/MikeMoulder/VNDC"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
