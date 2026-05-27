import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, borrowLimit: true },
  });
  if (!user) redirect("/login");

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashCard title="Browse books" desc="Search and request books from other students." href="/catalogue" cta="Browse catalogue" />
          <DashCard title="List a book" desc="Share a book you own and let others borrow it." href="/books/new" cta="Add listing" />
          <DashCard title="My swaps" desc="Track your active loans and incoming requests." href="/swaps" cta="View swaps" />
          <DashCard title="Wishlist" desc="Books you're keeping an eye on." href="/wishlist" cta="View wishlist" />
          <DashCard title="Leaderboard" desc="See the top lenders and borrowers." href="/leaderboard" cta="View leaderboard" />
          <DashCard title="Notifications" desc="Stay on top of requests and updates." href="/notifications" cta="View notifications" />
        </div>
      </main>
    </div>
  );
}

function DashCard({ title, desc, href, cta }: { title: string; desc: string; href: string; cta: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-black font-semibold mb-1">{title}</h2>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
      <Link href={href} className="mt-auto inline-block bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-all text-center">
        {cta}
      </Link>
    </div>
  );
}
