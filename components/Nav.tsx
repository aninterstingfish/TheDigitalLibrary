import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Nav({ active }: { active?: string }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { username: true, isAdmin: true } });
  if (!user) redirect("/login");

  let unreadCount = 0;
  try { unreadCount = await prisma.notification.count({ where: { userId: session.userId, read: false } }); } catch {}

  const links = [
    { href: "/catalogue", label: "Catalogue" },
    { href: "/swaps", label: "My Swaps" },
    { href: "/books/new", label: "List a Book" },
    { href: "/book-requests", label: "Requests" },
    { href: "/history", label: "History" },
    { href: "/wishlist", label: "Wishlist" },
    ...(user.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="bg-black px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
        <CloudBookIcon />
        <span className="text-white text-lg font-bold tracking-tight">Cloud Library</span>
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
        {/* Notification bell */}
        <Link href="/notifications" className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-label="Notifications">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Link href={`/profile/${user.username}`} className="px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
          @{user.username}
        </Link>
        <LogoutButton />
      </div>
    </nav>
  );
}

function CloudBookIcon() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Cloud */}
      <circle cx="11" cy="17" r="6" fill="white" />
      <circle cx="18" cy="12" r="7" fill="white" />
      <circle cx="25" cy="17" r="6" fill="white" />
      <rect x="5" y="17" width="26" height="8" rx="4" fill="white" />
      {/* Open book */}
      <path d="M18 16 L12 17.5 L12 23 L18 22 Z" fill="black" />
      <path d="M18 16 L24 17.5 L24 23 L18 22 Z" fill="black" />
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
