import Link from "next/link";
import { getStats } from "@/lib/stats";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-black flex-col justify-between p-14 relative overflow-hidden select-none">
        {/* Decorative rings */}
        <div aria-hidden className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full border border-white/10" />
        <div aria-hidden className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full border border-white/10" />
        <div aria-hidden className="absolute top-1/2 right-12 w-2 h-2 rounded-full bg-white/30" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <BookIcon />
          <span className="text-white text-xl font-bold tracking-tight">BookSwap</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-5">
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase">
            School Book Exchange
          </p>
          <h1 className="text-white text-[3.25rem] font-bold leading-[1.1] tracking-tight">
            Share books.<br />
            Earn trust.<br />
            Learn more.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-xs">
            Lend your books to classmates, borrow what you need, and build a
            reputation as a reliable swapper.
          </p>
        </div>

        {/* Live stats row */}
        <div className="relative z-10 flex gap-10 pt-6 border-t border-white/10">
          <Stat
            value={stats.books > 999 ? `${(stats.books / 1000).toFixed(1)}k+` : String(stats.books)}
            label="Books available"
          />
          <Stat value={String(stats.activeSwaps)} label="Active swaps" />
          <Stat
            value={stats.avgRating ? `${stats.avgRating} ★` : "—"}
            label="Avg. rating"
          />
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <BookIcon dark />
          <span className="text-black text-xl font-bold tracking-tight">BookSwap</span>
        </div>

        <LoginForm />

        <p className="mt-16 text-xs text-gray-300 text-center">
          By signing in you agree to BookSwap&apos;s{" "}
          <Link href="/terms" className="underline hover:text-gray-500 transition-colors">Terms</Link>
          {" "}&amp;{" "}
          <Link href="/privacy" className="underline hover:text-gray-500 transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-white text-2xl font-bold">{value}</div>
      <div className="text-white/40 text-xs mt-1">{label}</div>
    </div>
  );
}

function BookIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="28" height="28" rx="7" fill={dark ? "#000" : "#fff"} />
      <path d="M8 8h7a3 3 0 013 3v9a3 3 0 01-3 3H8V8z" fill={dark ? "#fff" : "#000"} />
      <path d="M15 8h1a3 3 0 013 3v9a3 3 0 01-3 3h-1" stroke={dark ? "#fff" : "#000"} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
