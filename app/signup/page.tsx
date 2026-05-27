import Link from "next/link";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-black flex-col justify-between p-14 relative overflow-hidden select-none">
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
            Your books.<br />
            Their gain.<br />
            Your rep.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-xs">
            List the books you&apos;re done with, lend them out, and build a
            star rating as a trusted swapper.
          </p>
        </div>

        {/* How it works */}
        <div className="relative z-10 space-y-4 pt-6 border-t border-white/10">
          <Step n="1" text="List a book with a photo and meet-up spot" />
          <Step n="2" text="Borrowers pick a swap date and send a request" />
          <Step n="3" text="Accept the best request and swap" />
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <BookIcon dark />
          <span className="text-black text-xl font-bold tracking-tight">BookSwap</span>
        </div>

        <SignupForm />

        <p className="mt-10 text-xs text-gray-300 text-center">
          By creating an account you agree to BookSwap&apos;s{" "}
          <Link href="/terms" className="underline hover:text-gray-500 transition-colors">Terms</Link>
          {" "}&amp;{" "}
          <Link href="/privacy" className="underline hover:text-gray-500 transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white/50 text-xs font-bold">
        {n}
      </span>
      <p className="text-white/50 text-sm leading-relaxed">{text}</p>
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
