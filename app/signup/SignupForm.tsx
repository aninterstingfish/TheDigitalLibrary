"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "details" | "consent" | "done" | "pending";
type Field = "name" | "username" | "email" | "password" | "confirm" | "age" | "parentEmail" | "childEmail" | "parentUsername";
interface Errors extends Partial<Record<Field, string>> { form?: string }

const USERNAME_RE = /^[a-zA-Z0-9_@#!$%^&*:"<>?{}+=.\-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm() {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [parentUsername, setParentUsername] = useState("");

  // Consent step (under-13)
  const [parentEmail, setParentEmail] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [noChildEmail, setNoChildEmail] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);

  const parsedAge = parseInt(age);
  const needsConsent = !isNaN(parsedAge) && parsedAge < 13;
  const canLinkParent = !isNaN(parsedAge) && parsedAge >= 13;

  function setField(setter: (v: string) => void, field: Field) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  function validateDetails(): Errors {
    const e: Errors = {};
    const a = parseInt(age);
    if (!name.trim()) e.name = "Full name is required.";
    else if (!/^[a-zA-Z\s]+$/.test(name.trim())) e.name = "Name can only contain letters and spaces.";
    if (!username.trim()) e.username = "Username is required.";
    else if (!USERNAME_RE.test(username)) {
      e.username = username.length < 3 ? "At least 3 characters." : username.length > 30 ? "30 characters maximum." : "Username contains an invalid character.";
    }
    if (!needsConsent) {
      if (!email.trim()) e.email = "Email is required.";
      else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
    }
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(password)) e.password = "Must contain at least one capital letter.";
    if (!confirm) e.confirm = "Please confirm your password.";
    else if (confirm !== password) e.confirm = "Passwords do not match.";
    if (!age) e.age = "Please enter your age.";
    else if (isNaN(a) || a < 5 || a > 110) e.age = "Please enter a valid age.";
    return e;
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateDetails();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (needsConsent) {
      setStep("consent");
    } else {
      submitForm();
    }
  }

  async function submitConsent(e: React.FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (!parentEmail.trim() || !EMAIL_RE.test(parentEmail.trim())) {
      errs.parentEmail = "Please enter a valid parent or guardian email address.";
    }
    if (!noChildEmail && childEmail.trim() && !EMAIL_RE.test(childEmail.trim())) {
      errs.childEmail = "Please enter a valid email address for your child.";
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    submitForm();
  }

  async function submitForm() {
    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          password,
          age: parseInt(age),
          ...(needsConsent
            ? {
                parentEmail: parentEmail.trim().toLowerCase(),
                childEmail: noChildEmail ? undefined : (childEmail.trim() || undefined),
              }
            : {
                email: email.trim().toLowerCase(),
                ...(parentUsername.trim() && { parentUsername: parentUsername.trim() }),
              }),
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        const field = data.field as Field | undefined;
        setErrors(field ? { [field]: data.error } : { form: data.error });
        // If error is on a details field while on consent step, go back
        if (step === "consent" && field && ["username"].includes(field)) setStep("details");
        setIsLoading(false);
        return;
      }
      setStep(data.pendingConsent ? "pending" : "done");
    } catch {
      setErrors({ form: "Network error — please check your connection and try again." });
    }
    setIsLoading(false);
  }

  // ── Under-13 pending consent success screen ──────────────────────────────
  if (step === "pending") {
    return (
      <div className="w-full max-w-[360px] text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Check your parent&apos;s email</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-3">
          We&apos;ve sent an approval email to <strong className="text-black">{parentEmail}</strong>.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Ask your parent or guardian to open it and click <strong className="text-black">Approve account</strong>.
          Once they approve, you can sign in here. The link expires in 7 days.
        </p>
        <Link href="/login"
          className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold text-center hover:bg-zinc-800 transition-all">
          Go to sign in
        </Link>
      </div>
    );
  }

  // ── Account created (13+) ─────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="w-full max-w-[360px] text-center">
        <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black mb-2">Account created!</h2>
        <p className="text-gray-500 text-sm mb-8">You&apos;re ready to start sharing books.</p>
        <Link href="/dashboard"
          className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold text-center hover:bg-zinc-800 transition-all">
          Go to dashboard
        </Link>
      </div>
    );
  }

  // ── Consent step (under-13) ───────────────────────────────────────────────
  if (step === "consent") {
    return (
      <div className="w-full max-w-[360px]">
        <button
          onClick={() => { setStep("details"); setErrors({}); }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-black tracking-tight mb-1">Parent approval needed</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Because you&apos;re under 13, we need your parent or guardian&apos;s permission before creating your account.
          We&apos;ll email them a link — they click <strong className="text-black">Approve</strong> and your account is ready.
        </p>

        <form onSubmit={submitConsent} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="parentEmail" className="block text-sm font-medium text-black">
              Parent or guardian&apos;s email <span className="text-red-400">*</span>
            </label>
            <input
              id="parentEmail"
              type="email"
              autoComplete="off"
              placeholder="parent@example.com"
              value={parentEmail}
              onChange={setField(setParentEmail, "parentEmail")}
              className={ic(!!errors.parentEmail)}
            />
            {errors.parentEmail && <p className="text-red-500 text-xs">{errors.parentEmail}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="childEmail" className="block text-sm font-medium text-black">
              Your email <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="childEmail"
              type="email"
              autoComplete="email"
              placeholder={noChildEmail ? "No email" : "your@email.com"}
              value={noChildEmail ? "" : childEmail}
              onChange={setField(setChildEmail, "childEmail")}
              disabled={noChildEmail}
              className={ic(!!errors.childEmail) + (noChildEmail ? " opacity-40 cursor-not-allowed" : "")}
            />
            {errors.childEmail && <p className="text-red-500 text-xs">{errors.childEmail}</p>}
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={noChildEmail}
                onChange={(e) => { setNoChildEmail(e.target.checked); setChildEmail(""); setErrors((err) => ({ ...err, childEmail: undefined })); }}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-500">I don&apos;t have an email address</span>
            </label>
            {noChildEmail && (
              <p className="text-xs text-gray-400">You&apos;ll log in with your username and password instead.</p>
            )}
          </div>

          {errors.form && (
            <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              <span className="mt-px shrink-0">⚠</span><span>{errors.form}</span>
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading
              ? <span className="flex items-center justify-center gap-2"><Spinner />Sending email…</span>
              : "Send approval email"}
          </button>
        </form>
      </div>
    );
  }

  // ── Step 1: Account details ───────────────────────────────────────────────
  return (
    <div className="w-full max-w-[360px]">
      <h2 className="text-[2rem] font-bold text-black tracking-tight leading-none mb-2">Create account</h2>
      <p className="text-gray-500 text-sm mb-8">Join Cloud Library and start sharing books.</p>

      <form onSubmit={handleDetailsSubmit} noValidate className="space-y-4">
        <InputField id="name" label="Full name" type="text" placeholder="Alex Johnson"
          value={name} onChange={setField(setName, "name")} error={errors.name} autoComplete="name"
          hint="Letters and spaces only." />

        <InputField id="username" label="Username" type="text" placeholder="Alex_J or Alex#99"
          value={username} onChange={setField(setUsername, "username")} error={errors.username} autoComplete="username"
          hint="3–30 characters. Letters, numbers and symbols allowed." />

        {!needsConsent && (
          <InputField id="email" label="Email" type="email" placeholder="alex@example.com"
            value={email} onChange={setField(setEmail, "email")} error={errors.email} autoComplete="email" />
        )}

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
            value={password} onChange={setField(setPassword, "password")} className={ic(!!errors.password)} />
          {errors.password
            ? <p className="text-red-500 text-xs">{errors.password}</p>
            : <p className="text-gray-400 text-xs">Must be 8+ characters and include a capital letter.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className="block text-sm font-medium text-black">Confirm password</label>
          <input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm} onChange={setField(setConfirm, "confirm")} className={ic(!!errors.confirm)} />
          {errors.confirm && <p className="text-red-500 text-xs">{errors.confirm}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="age" className="block text-sm font-medium text-black">Your age</label>
          <input id="age" type="number" min={5} max={110} placeholder="e.g. 14"
            value={age} onChange={setField(setAge, "age")} onWheel={(e) => e.currentTarget.blur()}
            className={ic(!!errors.age)} />
          {errors.age
            ? <p className="text-red-500 text-xs">{errors.age}</p>
            : <p className="text-gray-400 text-xs">Required for GDPR age verification.</p>}
        </div>

        {needsConsent && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Parent approval required.</strong> Because you&apos;re under 13, we need your parent or
                guardian&apos;s permission. On the next step, you&apos;ll enter their email address and we&apos;ll
                send them an approval link.
              </p>
            </div>
          </div>
        )}

        {canLinkParent && (
          <div className="space-y-1.5 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <label htmlFor="parentUsername" className="block text-sm font-medium text-black">
              Parent or guardian&apos;s username <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Optionally link your account so your parent can monitor your swaps. Leave blank if not needed.
            </p>
            <input id="parentUsername" type="text" placeholder="parent_username"
              value={parentUsername} onChange={setField(setParentUsername, "parentUsername")}
              className={ic(!!errors.parentUsername)} />
            {errors.parentUsername && <p className="text-red-500 text-xs">{errors.parentUsername}</p>}
          </div>
        )}

        {errors.form && (
          <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            <span className="mt-px shrink-0">⚠</span><span>{errors.form}</span>
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed !mt-6">
          {isLoading
            ? <span className="flex items-center justify-center gap-2"><Spinner />Creating account…</span>
            : needsConsent ? "Continue" : "Create account"}
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

function ic(hasError: boolean) {
  return `w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${hasError ? "border-red-300 bg-red-50" : "border-gray-200"}`;
}

function InputField({ id, label, type, placeholder, value, onChange, error, autoComplete, hint }: {
  id: string; label: string; type: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; autoComplete?: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-black">{label}</label>
      <input id={id} type={type} autoComplete={autoComplete} placeholder={placeholder}
        value={value} onChange={onChange} className={ic(!!error)} />
      {error ? <p className="text-red-500 text-xs">{error}</p> : hint ? <p className="text-gray-400 text-xs">{hint}</p> : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
