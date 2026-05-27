"use client";

import { useState } from "react";
import Link from "next/link";

type Field = "name" | "username" | "email" | "password" | "confirm" | "age";
interface FormState { name: string; username: string; email: string; password: string; confirm: string; age: boolean; }
interface Errors extends Partial<Record<Field, string>> {}

// Allowed username characters: letters, numbers, _@#!$%^&*:"<>?{}+=.-
const USERNAME_RE = /^[a-zA-Z0-9_@#!$%^&*:"<>?{}+=.\-]{3,30}$/;

function validateForm(form: FormState): Errors {
  const e: Errors = {};

  // Name — letters and spaces only, 2+ non-space chars
  if (!form.name.trim()) {
    e.name = "Full name is required.";
  } else if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
    e.name = "Name can only contain letters and spaces.";
  } else if (form.name.trim().replace(/\s+/g, "").length < 2) {
    e.name = "Name must be at least 2 characters.";
  }

  // Username
  if (!form.username.trim()) {
    e.username = "Username is required.";
  } else if (!USERNAME_RE.test(form.username)) {
    if (form.username.length < 3) e.username = "Username must be at least 3 characters.";
    else if (form.username.length > 30) e.username = "Username must be 30 characters or fewer.";
    else e.username = "Username contains an invalid character.";
  }

  // Email
  if (!form.email.trim()) {
    e.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    e.email = "Enter a valid email address.";
  }

  // Password — 8+ chars, must contain a capital letter
  if (!form.password) {
    e.password = "Password is required.";
  } else if (form.password.length < 8) {
    e.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(form.password)) {
    e.password = "Password must contain at least one capital letter.";
  }

  // Confirm
  if (!form.confirm) {
    e.confirm = "Please confirm your password.";
  } else if (form.confirm !== form.password) {
    e.confirm = "Passwords do not match.";
  }

  // Age
  if (!form.age) {
    e.age = "You must confirm you are 13 or older to create an account.";
  }

  return e;
}

export default function SignupForm() {
  const [form, setForm] = useState<FormState>({ name: "", username: "", email: "", password: "", confirm: "", age: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      setErrors({ [data.field ?? "email"]: data.error });
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-[360px] text-center">
        <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Account created!</h2>
        <p className="text-gray-500 text-sm mb-8">You&apos;re ready to start swapping books.</p>
        <Link href="/dashboard" className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold text-center hover:bg-zinc-800 transition-all">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px]">
      <h2 className="text-[2rem] font-bold text-black tracking-tight leading-none mb-2">Create account</h2>
      <p className="text-gray-500 text-sm mb-8">Join Cloud Library and start sharing books.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field id="name" label="Full name" type="text" placeholder="Alex Johnson"
          value={form.name} onChange={set("name")} error={errors.name} autoComplete="name"
          hint="Letters and spaces only." />

        <Field id="username" label="Username" type="text" placeholder="Alex_J or Alex#99"
          value={form.username} onChange={set("username")} error={errors.username} autoComplete="username"
          hint="3–30 characters. Letters, numbers and symbols allowed." />

        <Field id="email" label="Email" type="email" placeholder="alex@example.com"
          value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-medium text-black">Password</label>
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="text-xs font-medium text-gray-400 hover:text-black transition-colors">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
            placeholder="Min. 8 chars, one capital letter"
            value={form.password} onChange={set("password")} className={inputClass(!!errors.password)} />
          {errors.password
            ? <p className="text-red-500 text-xs">{errors.password}</p>
            : <p className="text-gray-400 text-xs">Must be 8+ characters and include a capital letter.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className="block text-sm font-medium text-black">Confirm password</label>
          <input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password"
            placeholder="Repeat your password"
            value={form.confirm} onChange={set("confirm")} className={inputClass(!!errors.confirm)} />
          {errors.confirm && <p className="text-red-500 text-xs">{errors.confirm}</p>}
        </div>

        {/* Age confirmation — required for GDPR */}
        <div className="space-y-1.5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.age}
              onChange={(e) => { setForm((f) => ({ ...f, age: e.target.checked })); setErrors((err) => ({ ...err, age: undefined })); }}
              className="mt-0.5 w-4 h-4 accent-black shrink-0" />
            <span className="text-sm text-gray-700">I confirm I am 13 or older (or have parental consent if under 16).</span>
          </label>
          {errors.age && <p className="text-red-500 text-xs">{errors.age}</p>}
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed !mt-6">
          {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Creating account…</span> : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-black font-semibold hover:underline underline-offset-2">Sign in</Link>
      </p>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${hasError ? "border-red-300 bg-red-50" : "border-gray-200"}`;
}

function Field({ id, label, type, placeholder, value, onChange, error, autoComplete, hint }: {
  id: string; label: string; type: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; autoComplete?: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-black">{label}</label>
      <input id={id} type={type} autoComplete={autoComplete} placeholder={placeholder}
        value={value} onChange={onChange} className={inputClass(!!error)} />
      {error
        ? <p className="text-red-500 text-xs">{error}</p>
        : hint ? <p className="text-gray-400 text-xs">{hint}</p>
        : null}
    </div>
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
