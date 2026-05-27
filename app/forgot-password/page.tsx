"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <Link href="/login" className="flex items-center gap-3 mb-12 group">
          <BookIcon dark />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>

        {submitted ? (
          <div>
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm mb-8">
              If <span className="text-black font-medium">{email}</span> is registered,
              you&apos;ll receive a reset link shortly.
            </p>
            <Link
              href="/login"
              className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold text-center hover:bg-zinc-800 transition-all"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-[2rem] font-bold text-black tracking-tight leading-none mb-2">
              Forgot password?
            </h2>
            <p className="text-gray-500 text-sm mb-10">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-black">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@school.edu"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
                {error && <p className="text-red-500 text-xs">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Sending…
                  </span>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link href="/login" className="text-black font-semibold hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
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

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
