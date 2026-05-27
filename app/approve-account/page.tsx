import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ApproveAccountPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  let status: "success" | "invalid" | "missing" = "missing";
  let childName = "";

  if (token) {
    const user = await prisma.user.findUnique({ where: { parentToken: token }, select: { id: true, name: true, approved: true } });

    if (!user) {
      status = "invalid";
    } else if (user.approved) {
      status = "success";
      childName = user.name;
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { approved: true, parentToken: null } });
      status = "success";
      childName = user.name;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
        <Link href="/login" className="flex items-center justify-center gap-3 mb-8">
          <CloudBookIcon />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>

        {status === "success" ? (
          <>
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Account activated!</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {childName ? <><strong className="text-black">{childName}</strong>&apos;s</> : "Your child's"} Cloud Library account is now active.
              They can sign in at the link below.
            </p>
            <Link href="/login"
              className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all text-center">
              Go to sign in
            </Link>
          </>
        ) : status === "invalid" ? (
          <>
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Link not found</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              This approval link has already been used or has expired. If the account still needs approval,
              please ask your child to sign up again.
            </p>
            <Link href="/login" className="text-sm text-gray-400 hover:text-black transition-colors">
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-black mb-2">Missing token</h1>
            <p className="text-gray-500 text-sm">No approval token found. Check the link in the email.</p>
          </>
        )}
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
