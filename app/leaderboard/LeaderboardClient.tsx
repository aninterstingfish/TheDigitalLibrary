"use client";

import { useState } from "react";
import Link from "next/link";

type Period = "weekly" | "monthly" | "annual" | "alltime";

type Entry = { rank: number; username: string; name: string; profilePhoto: string | null; value: number };

type LeaderboardData = {
  booksLoaned: Record<Period, Entry[]>;
  onTimeReturns: Record<Period, Entry[]>;
  avgRating: Record<Period, Entry[]>;
};

const PERIOD_LABELS: Record<Period, string> = { weekly: "This Week", monthly: "This Month", annual: "This Year", alltime: "All Time" };
const PERIODS: Period[] = ["weekly", "monthly", "annual", "alltime"];

export default function LeaderboardClient({ data }: { data: LeaderboardData }) {
  const [period, setPeriod] = useState<Period>("alltime");

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${period === p ? "bg-black text-white" : "text-gray-500 hover:text-black"}`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Board title="Most Books Loaned" icon="📚" entries={data.booksLoaned[period]} unit="loan" />
        <Board title="Most On-Time Returns" icon="✅" entries={data.onTimeReturns[period]} unit="return" />
        <Board title="Highest Avg Rating" icon="⭐" entries={data.avgRating[period]} unit="stars" isRating />
      </div>
    </div>
  );
}

function Board({ title, icon, entries, unit, isRating }: { title: string; icon: string; entries: Entry[]; unit: string; isRating?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-black mb-4 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h2>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => {
            const initials = e.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
            const medal = e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : null;
            return (
              <div key={e.username} className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-gray-400 shrink-0 text-right">{medal ?? `${e.rank}.`}</span>
                <div className="w-8 h-8 rounded-full bg-black overflow-hidden flex items-center justify-center shrink-0">
                  {e.profilePhoto
                    ? <img src={e.profilePhoto} alt={e.name} className="w-full h-full object-cover" />
                    : <span className="text-white text-xs font-bold">{initials}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${e.username}`} className="text-sm font-medium text-black hover:underline truncate block">@{e.username}</Link>
                </div>
                <span className="text-sm font-bold text-black shrink-0">
                  {isRating ? e.value.toFixed(1) : e.value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
