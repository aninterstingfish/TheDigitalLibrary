import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import ApproveButton from "./ApproveButton";
import ChildAccountActions from "./ChildAccountActions";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      isAdmin: true,
      name: true,
      username: true,
      children: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          approved: true,
          paused: true,
          damagedReports: true,
          nonReturns: true,
          createdAt: true,
          swapRequests: {
            where: { swap: { handedOver: true, ownerConfirmedReturn: false } },
            select: {
              id: true,
              book: { select: { title: true } },
              swap: { select: { returnDate: true, pickupDate: true } },
            },
          },
          ownedBooks: {
            where: { requests: { some: { swap: { handedOver: true, ownerConfirmedReturn: false } } } },
            select: {
              id: true,
              title: true,
              requests: {
                where: { swap: { handedOver: true, ownerConfirmedReturn: false } },
                select: {
                  borrower: { select: { username: true, parentId: true } },
                  swap: { select: { returnDate: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!admin?.isAdmin) redirect("/dashboard");

  const pending = admin.children.filter((c) => !c.approved);
  const approved = admin.children.filter((c) => c.approved);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/admin" />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-black mb-1">Parent panel</h1>
          <p className="text-gray-500 text-sm">Managing accounts linked to <strong>@{admin.username}</strong></p>
        </div>

        {/* Pending approvals */}
        {pending.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-3">Awaiting approval</h2>
            <div className="space-y-3">
              {pending.map((child) => (
                <div key={child.id} className="bg-white rounded-2xl border border-amber-100 p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-black text-sm">{child.name}</p>
                    <p className="text-gray-400 text-xs">@{child.username} · {child.email}</p>
                    <p className="text-gray-300 text-xs mt-0.5">
                      Signed up {new Date(child.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <ApproveButton userId={child.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Children's activity */}
        {approved.map((child) => {
          const activeBorrows = child.swapRequests;
          const activeLends = child.ownedBooks.flatMap((b) =>
            b.requests.map((r) => ({ bookTitle: b.title, borrowerUsername: r.borrower.username, returnDate: r.swap?.returnDate, borrowerParentId: r.borrower.parentId }))
          );
          const overdueBorrows = activeBorrows.filter((r) => r.swap?.returnDate && new Date(r.swap.returnDate) < new Date());
          const overdueLends = activeLends.filter((l) => l.returnDate && new Date(l.returnDate) < new Date());

          return (
            <section key={child.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-black uppercase tracking-wide">{child.name} (@{child.username})</h2>
                <div className="flex items-center gap-3">
                  {child.paused && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-medium">Paused</span>
                  )}
                  {child.nonReturns > 0 && (
                    <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-lg font-medium">
                      {child.nonReturns} unreturned book{child.nonReturns > 1 ? "s" : ""}
                    </span>
                  )}
                  <Link href={`/admin/history/${child.id}`}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    History
                  </Link>
                  <Link href={`/admin/list-book/${child.id}`}
                    className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-medium hover:bg-zinc-800 transition-all">
                    List a book
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {activeBorrows.length === 0 && activeLends.length === 0 ? (
                  <p className="text-gray-400 text-sm p-5">No active swaps.</p>
                ) : null}

                {activeBorrows.map((r) => {
                  const due = r.swap?.returnDate ? new Date(r.swap.returnDate) : null;
                  const overdue = due && due < new Date();
                  return (
                    <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-black">Borrowing: {r.book.title}</p>
                        {due && <p className={`text-xs mt-0.5 ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                          {overdue ? "OVERDUE — " : "Due back "}
                          {due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>}
                      </div>
                      <Link href={`/swaps/${r.id}`} className="text-xs text-gray-400 hover:text-black transition-colors">View swap →</Link>
                    </div>
                  );
                })}

                {activeLends.map((l, i) => {
                  const due = l.returnDate ? new Date(l.returnDate) : null;
                  const overdue = due && due < new Date();
                  return (
                    <div key={i} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-black">Lent out: {l.bookTitle}</p>
                        <p className="text-xs text-gray-400 mt-0.5">to @{l.borrowerUsername}</p>
                        {due && <p className={`text-xs mt-0.5 ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                          {overdue ? "OVERDUE — " : "Due back "}
                          {due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(overdueBorrows.length > 0 || overdueLends.length > 0) && (
                <p className="text-xs text-red-500 mt-2">
                  There are overdue items. Contact the other party through the swap chat.
                </p>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 px-5">
                <ChildAccountActions userId={child.id} paused={child.paused} />
              </div>
            </section>
          );
        })}

        {admin.children.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">No children linked to your account yet.</p>
            <p className="text-gray-400 text-xs mt-1">Ask your child to sign up and enter your username <strong className="text-gray-500">@{admin.username}</strong>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
