import Link from "next/link";

export default async function ApproveAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; name?: string }>;
}) {
  const { status, name } = await searchParams;

  if (status === "approved") {
    return (
      <Shell>
        <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Account approved</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {name ? <><strong className="text-black">{name}</strong>&apos;s account has been approved.</> : "The account has been approved."}
          {" "}They can now sign in to Cloud Library.
        </p>
        <Link href="/login"
          className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all text-center">
          Go to sign in
        </Link>
      </Shell>
    );
  }

  if (status === "declined") {
    return (
      <Shell>
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Account request declined</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          The account request has been declined and no account has been created.
          If this was a mistake, ask your child to sign up again.
        </p>
        <Link href="/login"
          className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all text-center">
          Go to sign in
        </Link>
      </Shell>
    );
  }

  if (status === "expired") {
    return (
      <Shell>
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Link expired</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          This approval link has expired (links are valid for 7 days).
          Ask your child to try signing in — they can request a new email from the login page.
        </p>
        <Link href="/login"
          className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all text-center">
          Go to sign in
        </Link>
      </Shell>
    );
  }

  // Default / invalid
  return (
    <Shell>
      <h1 className="text-2xl font-bold text-black mb-2">Account approval</h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">
        To approve your child&apos;s account, open the approval email sent to you and click
        <strong className="text-black"> Approve account</strong>.
      </p>
      <Link href="/login"
        className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all text-center">
        Go to sign in
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
        <Link href="/login" className="flex items-center justify-center gap-3 mb-8">
          <CloudBookIcon />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>
        {children}
      </div>
    </div>
  );
}

function CloudBookIcon() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="11" cy="17" r="6" fill="#000" />
      <circle cx="18" cy="12" r="7" fill="#000" />
      <circle cx="25" cy="17" r="6" fill="#000" />
      <rect x="5" y="17" width="26" height="8" rx="4" fill="#000" />
      <path d="M18 16 L12 17.5 L12 23 L18 22 Z" fill="#fff" />
      <path d="M18 16 L24 17.5 L24 23 L18 22 Z" fill="#fff" />
    </svg>
  );
}
