import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import MarkAllReadButton from "./MarkAllReadButton";

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  NEW_REQUEST: "📬", REQUEST_ACCEPTED: "✅", REQUEST_REJECTED: "❌",
  COUNTER_OFFER: "🔄", RETURN_CONFIRMED: "📦", RATING_RECEIVED: "⭐",
  REMINDER: "⏰", OVERDUE: "🚨", DEFAULT: "🔔",
};

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark all as read (fire and forget in server component via separate action handled by client button)

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black tracking-tight mb-1">Notifications</h1>
            <p className="text-gray-500 text-sm">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
          </div>
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-400 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`bg-white rounded-2xl border p-4 flex gap-3 transition-all ${n.read ? "border-gray-100" : "border-black/10 bg-blue-50/30"}`}>
                <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? TYPE_ICON.DEFAULT}</span>
                <div className="flex-1 min-w-0">
                  {n.link ? (
                    <Link href={n.link} className="text-sm text-black hover:underline">{n.message}</Link>
                  ) : (
                    <p className="text-sm text-black">{n.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
