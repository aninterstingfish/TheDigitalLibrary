import Link from "next/link";

// Approval is now done from the Admin panel — this page is no longer used.
export default async function ApproveAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
        <Link href="/login" className="flex items-center justify-center gap-3 mb-8">
          <CloudBookIcon />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>
        <h1 className="text-2xl font-bold text-black mb-2">Account approval</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          To approve your child&apos;s account, log in to your Cloud Library account and visit the <strong className="text-black">Admin panel</strong>.
          You&apos;ll see their account listed under <strong className="text-black">Awaiting approval</strong>.
        </p>
        <Link href="/login"
          className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all text-center">
          Go to sign in
        </Link>
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
