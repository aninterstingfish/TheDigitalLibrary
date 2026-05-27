import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true, borrowLimit: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-black px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <BookIcon />
          <span className="text-white text-lg font-bold tracking-tight">BookSwap</span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-white/60 text-sm">@{user.username}</span>
          <LogoutButton />
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          You can borrow up to <span className="text-black font-semibold">{user.borrowLimit}</span> books at a time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashCard
            title="Browse books"
            desc="Search and request books from other students."
            href="/catalogue"
            cta="Browse catalogue"
          />
          <DashCard
            title="List a book"
            desc="Share a book you own and let others borrow it."
            href="/books/new"
            cta="Add listing"
          />
          <DashCard
            title="My swaps"
            desc="Track your active loans and incoming requests."
            href="/swaps"
            cta="View swaps"
          />
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
      <Link
        href={href}
        className="mt-auto inline-block bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-all text-center"
      >
        {cta}
      </Link>
    </div>
  );
}

function BookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="28" height="28" rx="7" fill="#fff" />
      <path d="M8 8h7a3 3 0 013 3v9a3 3 0 01-3 3H8V8z" fill="#000" />
      <path d="M15 8h1a3 3 0 013 3v9a3 3 0 01-3 3h-1" stroke="#000" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function LogoutButton() {
  return (
    <form action={async () => {
      "use server";
      const { deleteSession } = await import("@/lib/session");
      await deleteSession();
      const { redirect } = await import("next/navigation");
      redirect("/login");
    }}>
      <button
        type="submit"
        className="text-white/60 hover:text-white text-sm transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
