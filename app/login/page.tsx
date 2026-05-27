"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    // TODO: wire up NextAuth sign-in
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setError("Authentication not yet configured — coming soon.");
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-black flex-col justify-between p-14 relative overflow-hidden select-none">
        {/* Decorative circles */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute top-1/2 right-12 w-2 h-2 rounded-full bg-white/30"
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <BookIcon />
          <span className="text-white text-xl font-bold tracking-tight">
            BookSwap
          </span>
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

        {/* Stats row */}
        <div className="relative z-10 flex gap-10 pt-6 border-t border-white/10">
          <Stat value="2 400+" label="Books listed" />
          <Stat value="860" label="Active swaps" />
          <Stat value="4.9 ★" label="Avg. rating" />
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <BookIcon dark />
          <span className="text-black text-xl font-bold tracking-tight">
            BookSwap
          </span>
        </div>

        <div className="w-full max-w-[360px]">
          <h2 className="text-[2rem] font-bold text-black tracking-tight leading-none mb-2">
            Sign in
          </h2>
          <p className="text-gray-500 text-sm mb-10">
            Welcome back. Enter your details to continue.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-black"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-black"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-400 hover:text-black transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl"
              >
                <span className="mt-px shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Sign-up CTA */}
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-black font-semibold hover:underline underline-offset-2"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-16 text-xs text-gray-300 text-center">
          By signing in you agree to BookSwap&apos;s{" "}
          <Link href="/terms" className="underline hover:text-gray-500 transition-colors">
            Terms
          </Link>{" "}
          &amp;{" "}
          <Link href="/privacy" className="underline hover:text-gray-500 transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-white text-2xl font-bold">{value}</div>
      <div className="text-white/40 text-xs mt-1">{label}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function BookIcon({ dark }: { dark?: boolean }) {
  const fill = dark ? "#000" : "#fff";
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="28" height="28" rx="7" fill={dark ? "#000" : "#fff"} />
      <path
        d="M8 8h7a3 3 0 013 3v9a3 3 0 01-3 3H8V8z"
        fill={dark ? "#fff" : "#000"}
      />
      <path
        d="M15 8h1a3 3 0 013 3v9a3 3 0 01-3 3h-1"
        stroke={dark ? "#fff" : "#000"}
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
