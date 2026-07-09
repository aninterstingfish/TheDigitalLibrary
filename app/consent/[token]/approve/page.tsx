import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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

export default async function ConsentApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let status: "success" | "expired" | "invalid" | "already_approved" = "invalid";
  let childName = "";

  const request = await prisma.consentRequest.findUnique({ where: { token } });

  if (!request) {
    // Could be already approved (request deleted) or simply invalid
    status = "invalid";
  } else if (request.expiresAt < new Date()) {
    // Expired — delete pending data immediately
    await prisma.consentRequest.delete({ where: { id: request.id } });
    status = "expired";
  } else {
    childName = request.name;

    // Generate placeholder email if child has none
    const userEmail = request.childEmail ?? `noemail.${request.username}@cloudlibrary.internal`;

    // Check username isn't taken by now (race condition)
    const existingUsername = await prisma.user.findFirst({ where: { username: request.username } });
    const existingEmail = request.childEmail
      ? await prisma.user.findFirst({ where: { email: request.childEmail } })
      : null;

    if (!existingUsername && !existingEmail) {
      await prisma.user.create({
        data: {
          name: request.name,
          username: request.username,
          email: userEmail,
          passwordHash: request.passwordHash,
          approved: true,
        },
      });
    }

    // Delete the pending request regardless (approved or conflict)
    await prisma.consentRequest.delete({ where: { id: request.id } });
    status = existingUsername ? "already_approved" : "success";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
        <Link href="/login" className="flex items-center justify-center gap-3 mb-8">
          <CloudBookIcon />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>

        {status === "success" && (
          <>
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Account approved!</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              <strong className="text-black">{childName}</strong>&apos;s Cloud Library account is now active.
              They can sign in using their username and password.
            </p>
            <Link href="/login"
              className="block w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all text-center">
              Go to sign in
            </Link>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Link expired</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              This approval link has expired (links are valid for 7 days).
              The account request has been removed — please ask your child to sign up again.
            </p>
            <Link href="/login" className="text-sm text-gray-400 hover:text-black transition-colors">
              Go to sign in
            </Link>
          </>
        )}

        {(status === "invalid" || status === "already_approved") && (
          <>
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Already done</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              This approval link has already been used. If the account isn&apos;t working, please ask your child to sign up again.
            </p>
            <Link href="/login" className="text-sm text-gray-400 hover:text-black transition-colors">
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
