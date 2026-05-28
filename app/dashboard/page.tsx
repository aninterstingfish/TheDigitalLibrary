import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      borrowLimit: true,
      isAdmin: true,
      swapRequests: {
        where: { swap: { handedOver: true, ownerConfirmedReturn: false } },
        select: {
          id: true,
          book: { select: { title: true } },
          swap: { select: { returnDate: true, loanMode: true } },
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
              id: true,
              borrower: { select: { username: true } },
              swap: { select: { returnDate: true } },
            },
          },
        },
      },
    },
  });
  if (!user) redirect("/login");

  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const activeBorrows = user.swapRequests.map((r) => ({
    requestId: r.id,
    title: r.book.title,
    returnDate: r.swap?.returnDate ?? null,
    loanMode: r.swap?.loanMode ?? null,
  }));

  const activeLends = user.ownedBooks.flatMap((b) =>
    b.requests.map((r) => ({
      requestId: r.id,
      title: b.title,
      borrowerUsername: r.borrower.username,
      returnDate: r.swap?.returnDate ?? null,
    }))
  );

  const overdueBorrows = activeBorrows.filter((r) => r.returnDate && new Date(r.returnDate) < now);
  const overdueAsOwner = activeLends.filter((l) => l.returnDate && new Date(l.returnDate) < now);
  const dueSoonBorrows = activeBorrows.filter((r) => r.returnDate && new Date(r.returnDate) >= now && new Date(r.returnDate) <= soon);
  const dueSoonLends = activeLends.filter((l) => l.returnDate && new Date(l.returnDate) >= now && new Date(l.returnDate) <= soon);

  const overdueCount = overdueBorrows.length + overdueAsOwner.length;
  const dueSoonCount = dueSoonBorrows.length + dueSoonLends.length;
  const activeCount = activeBorrows.length + activeLends.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/dashboard" />
      <main className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          You can borrow up to <span className="text-black font-semibold">{user.borrowLimit}</span> books at a time.
        </p>

        {/* Alerts */}
        {overdueCount > 0 && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
            <p className="text-sm font-semibold text-red-600">
              {overdueCount} overdue {overdueCount === 1 ? "swap" : "swaps"} — check your active swaps.
            </p>
            {overdueBorrows.map((r) => (
              <p key={r.requestId} className="text-xs text-red-400 mt-1">
                Borrowing <Link href={`/swaps/${r.requestId}`} className="font-medium hover:underline">{r.title}</Link>
                {r.returnDate && <> — was due {fmtDate(new Date(r.returnDate))}</>}
              </p>
            ))}
            {overdueAsOwner.map((l) => (
              <p key={l.requestId} className="text-xs text-red-400 mt-1">
                <Link href={`/swaps/${l.requestId}`} className="font-medium hover:underline">{l.title}</Link>
                {" "}lent to @{l.borrowerUsername}
                {l.returnDate && <> — was due {fmtDate(new Date(l.returnDate))}</>}
              </p>
            ))}
          </div>
        )}

        {dueSoonCount > 0 && overdueCount === 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
            <p className="text-sm font-semibold text-amber-700">
              {dueSoonCount} {dueSoonCount === 1 ? "swap" : "swaps"} due within 7 days.
            </p>
            {dueSoonBorrows.map((r) => (
              <p key={r.requestId} className="text-xs text-amber-600 mt-1">
                Return <Link href={`/swaps/${r.requestId}`} className="font-medium hover:underline">{r.title}</Link>
                {r.returnDate && <> by {fmtDate(new Date(r.returnDate))}</>}
              </p>
            ))}
            {dueSoonLends.map((l) => (
              <p key={l.requestId} className="text-xs text-amber-600 mt-1">
                <Link href={`/swaps/${l.requestId}`} className="font-medium hover:underline">{l.title}</Link>
                {" "}lent to @{l.borrowerUsername}
                {l.returnDate && <> — due {fmtDate(new Date(l.returnDate))}</>}
              </p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashCard title="Browse books" desc="Search and request books from other students." href="/catalogue" cta="Browse catalogue" />
          <DashCard title="List a book" desc="Share a book you own and let others borrow it." href="/books/new" cta="Add listing" />
          <DashCard
            title="My swaps"
            desc={activeCount > 0 ? `${activeCount} active swap${activeCount !== 1 ? "s" : ""}.` : "Track your active loans and incoming requests."}
            href="/swaps"
            cta="View swaps"
            badge={overdueCount > 0 ? { text: `${overdueCount} overdue`, color: "red" } : dueSoonCount > 0 ? { text: `${dueSoonCount} due soon`, color: "amber" } : undefined}
          />
          <DashCard title="Wishlist" desc="Books you're keeping an eye on." href="/wishlist" cta="View wishlist" />
          <DashCard title="Leaderboard" desc="See the top lenders and borrowers." href="/leaderboard" cta="View leaderboard" />
          <DashCard title="Notifications" desc="Stay on top of requests and updates." href="/notifications" cta="View notifications" />
          <DashCard title="Book requests" desc="Request a title that isn't in the catalogue yet." href="/book-requests" cta="View requests" />
          <DashCard title="Borrowing history" desc="See your complete lending and borrowing record." href="/history" cta="View history" />
          {user.isAdmin && (
            <DashCard title="Parent panel" desc="Manage linked child accounts and monitor their swaps." href="/admin" cta="Open panel" />
          )}
        </div>
      </main>
    </div>
  );
}

function DashCard({ title, desc, href, cta, badge }: {
  title: string;
  desc: string;
  href: string;
  cta: string;
  badge?: { text: string; color: "red" | "amber" };
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-black font-semibold mb-1">{title}</h2>
          {badge && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
              badge.color === "red" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
            }`}>
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
      <Link href={href} className="mt-auto inline-block bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-all text-center">
        {cta}
      </Link>
    </div>
  );
}
