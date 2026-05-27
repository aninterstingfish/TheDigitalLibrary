import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import LeaderboardClient from "./LeaderboardClient";

type Period = "weekly" | "monthly" | "annual" | "alltime";
type Entry = { rank: number; username: string; name: string; profilePhoto: string | null; value: number };

function periodStart(p: Period): Date | null {
  if (p === "alltime") return null;
  const d = new Date();
  if (p === "weekly") d.setDate(d.getDate() - 7);
  else if (p === "monthly") d.setDate(d.getDate() - 30);
  else d.setDate(d.getDate() - 365);
  return d;
}

async function getBooksLoaned(since: Date | null): Promise<Entry[]> {
  const swaps = await prisma.swap.findMany({
    where: { ownerConfirmedReturn: true, ...(since ? { returnConfirmedAt: { gte: since } } : {}) },
    include: { request: { include: { book: { include: { owner: { select: { id: true, username: true, name: true, profilePhoto: true } } } } } } },
  });
  const counts = new Map<string, { user: { username: string; name: string; profilePhoto: string | null }; count: number }>();
  for (const s of swaps) {
    const owner = s.request.book.owner;
    const cur = counts.get(owner.id);
    if (cur) cur.count++;
    else counts.set(owner.id, { user: owner, count: 1 });
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([, v], i) => ({ rank: i + 1, username: v.user.username, name: v.user.name, profilePhoto: v.user.profilePhoto, value: v.count }));
}

async function getOnTimeReturns(since: Date | null): Promise<Entry[]> {
  const swaps = await prisma.swap.findMany({
    where: { ownerConfirmedReturn: true, loanMode: "FIXED_DATE", returnDate: { not: null }, ...(since ? { returnConfirmedAt: { gte: since } } : {}) },
    include: { request: { include: { borrower: { select: { id: true, username: true, name: true, profilePhoto: true } } } } },
  });
  const counts = new Map<string, { user: { username: string; name: string; profilePhoto: string | null }; count: number }>();
  for (const s of swaps) {
    if (!s.returnConfirmedAt || !s.returnDate) continue;
    if (s.returnConfirmedAt > s.returnDate) continue;
    const borrower = s.request.borrower;
    const cur = counts.get(borrower.id);
    if (cur) cur.count++;
    else counts.set(borrower.id, { user: borrower, count: 1 });
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([, v], i) => ({ rank: i + 1, username: v.user.username, name: v.user.name, profilePhoto: v.user.profilePhoto, value: v.count }));
}

async function getAvgRating(since: Date | null): Promise<Entry[]> {
  const ratings = await prisma.rating.findMany({
    where: { ...(since ? { createdAt: { gte: since } } : {}) },
    include: { ratee: { select: { id: true, username: true, name: true, profilePhoto: true } } },
  });
  const totals = new Map<string, { user: { username: string; name: string; profilePhoto: string | null }; sum: number; count: number }>();
  for (const r of ratings) {
    const cur = totals.get(r.rateeId);
    if (cur) { cur.sum += r.stars; cur.count++; }
    else totals.set(r.rateeId, { user: r.ratee, sum: r.stars, count: 1 });
  }
  return [...totals.entries()]
    .filter(([, v]) => v.count >= 1)
    .sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count)
    .slice(0, 10)
    .map(([, v], i) => ({ rank: i + 1, username: v.user.username, name: v.user.name, profilePhoto: v.user.profilePhoto, value: v.sum / v.count }));
}

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const periods: Period[] = ["weekly", "monthly", "annual", "alltime"];
  const [booksLoanedAll, onTimeAll, avgRatingAll] = await Promise.all([
    Promise.all(periods.map((p) => getBooksLoaned(periodStart(p)))),
    Promise.all(periods.map((p) => getOnTimeReturns(periodStart(p)))),
    Promise.all(periods.map((p) => getAvgRating(periodStart(p)))),
  ]);

  const data = {
    booksLoaned: Object.fromEntries(periods.map((p, i) => [p, booksLoanedAll[i]])) as Record<Period, Entry[]>,
    onTimeReturns: Object.fromEntries(periods.map((p, i) => [p, onTimeAll[i]])) as Record<Period, Entry[]>,
    avgRating: Object.fromEntries(periods.map((p, i) => [p, avgRatingAll[i]])) as Record<Period, Entry[]>,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">Leaderboard</h1>
        <p className="text-gray-500 text-sm mb-8">Top borrowers and lenders in your library.</p>
        <LeaderboardClient data={data} />
      </main>
    </div>
  );
}
