import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

export default async function ConsentDeclinePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let childName = "";
  const request = await prisma.consentRequest.findUnique({ where: { token } });

  if (request) {
    childName = request.name;
    // Delete immediately — no account, no data kept
    await prisma.consentRequest.delete({ where: { id: request.id } });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
        <Link href="/login" className="flex items-center justify-center gap-3 mb-8">
          <CloudBookIcon />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>

        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-black mb-2">Request declined</h1>

        {childName ? (
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            <strong className="text-black">{childName}</strong>&apos;s account request has been declined and all
            their sign-up details have been deleted. No account has been created.
          </p>
        ) : (
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            This request has already been handled or the link has expired. No account was created.
          </p>
        )}

        <p className="text-gray-400 text-xs mb-6">
          If this was a mistake, ask your child to sign up again and send a new approval email.
        </p>

        <Link href="/login" className="text-sm text-gray-400 hover:text-black transition-colors">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
