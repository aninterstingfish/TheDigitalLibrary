import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Nav({ active }: { active?: string }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true },
  });
  if (!user) redirect("/login");

  const links = [
    { href: "/catalogue", label: "Catalogue" },
    { href: "/swaps", label: "My Swaps" },
    { href: "/books/new", label: "List a Book" },
  ];

  return (
    <nav className="bg-black px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
        <BookIcon />
        <span className="text-white text-lg font-bold tracking-tight">BookSwap</span>
      </Link>
      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === l.href
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <div className="w-px h-4 bg-white/20 mx-2" />
        <span className="text-white/40 text-sm mr-2">@{user.username}</span>
        <LogoutButton />
      </div>
    </nav>
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
    <form
      action={async () => {
        "use server";
        const { deleteSession } = await import("@/lib/session");
        await deleteSession();
        const { redirect } = await import("next/navigation");
        redirect("/login");
      }}
    >
      <button
        type="submit"
        className="px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
