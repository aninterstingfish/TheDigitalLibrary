"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingConsent, setPendingConsent] = useState<{ parentEmail: string; userId: string } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      if (data.code === "PENDING_CONSENT") {
        setPendingConsent({ parentEmail: data.parentEmail, userId: data.userId });
        setIsLoading(false);
        return;
      }
      setError(data.error || "Sign in failed.");
      setIsLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  };

  const handleResend = async () => {
    if (!pendingConsent || resendLoading) return;
    setResendLoading(true);
    setResendSent(false);
    try {
      await fetch("/api/auth/resend-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingConsent.userId }),
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  if (pendingConsent) {
    return (
      <div className="w-full max-w-[360px] text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Check your parent&apos;s inbox</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          An approval email has been sent to
        </p>
        <p className="text-black font-semibold text-sm mb-6">{pendingConsent.parentEmail}</p>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Ask your parent or guardian to open the email and click <strong className="text-black">Approve account</strong>.
          Once they do, you can sign in here.
        </p>
        {resendSent
          ? <p className="text-green-600 text-sm font-medium mb-4">Email resent successfully.</p>
          : (
            <button onClick={handleResend} disabled={resendLoading}
              className="block w-full border border-gray-200 text-black py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all mb-3 disabled:opacity-50">
              {resendLoading ? "Resending…" : "Resend approval email"}
            </button>
          )}
        <button onClick={() => { setPendingConsent(null); setResendSent(false); }}
          className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px]">
      <h2 className="text-[2rem] font-bold text-black tracking-tight leading-none mb-2">
        Sign in
      </h2>
      <p className="text-gray-500 text-sm mb-10">
        Welcome back. Enter your details to continue.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-medium text-black">
            Username or email
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Alex_J or alex@example.com"
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-medium text-black">
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

        {error && (
          <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            <span className="mt-px shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

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

      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
