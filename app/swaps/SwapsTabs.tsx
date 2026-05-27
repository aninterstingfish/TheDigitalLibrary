"use client";

import { useState } from "react";
import Link from "next/link";

type RequestItem = {
  id: string;
  status: string;
  loanMode: string;
  requestedPickupDate: string | null;
  requestedReturnDate: string | null;
  createdAt: string;
  book: { id: string; title: string; coverPhoto: string | null };
  borrower?: { username: string; name: string };
  owner?: { username: string; name: string };
};

type SwapItem = {
  id: string;
  loanMode: string;
  pickupDate: string | null;
  returnDate: string | null;
  confirmedAt: string;
  book: { id: string; title: string; coverPhoto: string | null };
  other: { username: string; name: string };
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  COUNTER_PROPOSED: "bg-blue-100 text-blue-700",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  COUNTER_PROPOSED: "Counter offer",
};

function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SwapsTabs({
  pendingRequests,
  activeAsOwner,
  myPendingRequests,
  activeAsBorrower,
}: {
  pendingRequests: RequestItem[];
  activeAsOwner: SwapItem[];
  myPendingRequests: RequestItem[];
  activeAsBorrower: SwapItem[];
}) {
  const [tab, setTab] = useState<"owner" | "borrower">("owner");
  const ownerCount = pendingRequests.length + activeAsOwner.length;
  const borrowerCount = myPendingRequests.length + activeAsBorrower.length;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-black tracking-tight mb-8">My Swaps</h1>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-8">
        <TabBtn active={tab === "owner"} count={ownerCount} onClick={() => setTab("owner")}>As Owner</TabBtn>
        <TabBtn active={tab === "borrower"} count={borrowerCount} onClick={() => setTab("borrower")}>As Borrower</TabBtn>
      </div>

      {tab === "owner" ? (
        <OwnerPanel pending={pendingRequests} active={activeAsOwner} />
      ) : (
        <BorrowerPanel pending={myPendingRequests} active={activeAsBorrower} />
      )}
    </main>
  );
}

function TabBtn({ active, count, onClick, children }: { active: boolean; count: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${active ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
    >
      {children}
      {count > 0 && (
        <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${active ? "bg-black text-white" : "bg-gray-300 text-gray-600"}`}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

function OwnerPanel({ pending, active }: { pending: RequestItem[]; active: SwapItem[] }) {
  if (pending.length === 0 && active.length === 0) {
    return (
      <Empty
        title="No activity yet"
        desc="When students request your books, you'll see them here."
        href="/books/new"
        cta="List a book"
      />
    );
  }
  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <Section title="Pending requests">
          {pending.map((r) => (
            <RequestCard key={r.id} item={r} who={r.borrower} whoLabel="Requested by" />
          ))}
        </Section>
      )}
      {active.length > 0 && (
        <Section title="Currently on loan">
          {active.map((s) => (
            <ActiveCard key={s.id} item={s} whoLabel="Borrowed by" />
          ))}
        </Section>
      )}
    </div>
  );
}

function BorrowerPanel({ pending, active }: { pending: RequestItem[]; active: SwapItem[] }) {
  if (pending.length === 0 && active.length === 0) {
    return (
      <Empty
        title="No borrows yet"
        desc="Browse the catalogue and request a book to get started."
        href="/catalogue"
        cta="Browse catalogue"
      />
    );
  }
  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <Section title="My requests">
          {pending.map((r) => (
            <RequestCard key={r.id} item={r} who={r.owner} whoLabel="Owned by" />
          ))}
        </Section>
      )}
      {active.length > 0 && (
        <Section title="Books I'm borrowing">
          {active.map((s) => (
            <ActiveCard key={s.id} item={s} whoLabel="Owned by" />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function RequestCard({ item, who, whoLabel }: { item: RequestItem; who?: { username: string; name: string }; whoLabel: string }) {
  const pickup = fmt(item.requestedPickupDate);
  const ret = fmt(item.requestedReturnDate);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3.5">
      <BookThumb src={item.book.coverPhoto} alt={item.book.title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-black text-sm line-clamp-1">{item.book.title}</p>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[item.status] ?? "bg-gray-100 text-gray-600"}`}>
            {STATUS_LABEL[item.status] ?? item.status}
          </span>
        </div>
        {who && <p className="text-xs text-gray-400 mb-2">{whoLabel} @{who.username}</p>}
        <div className="flex gap-3 text-xs text-gray-500">
          {item.loanMode === "READ_TILL_FINISH" ? (
            <span>Read till finish</span>
          ) : (
            <>
              {pickup && <span>Pickup: {pickup}</span>}
              {ret && <span>· Return: {ret}</span>}
            </>
          )}
        </div>
        <div className="mt-3">
          <Link href={`/swaps/${item.id}`} className="text-xs font-semibold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all">
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActiveCard({ item, whoLabel }: { item: SwapItem; whoLabel: string }) {
  const ret = fmt(item.returnDate);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3.5">
      <BookThumb src={item.book.coverPhoto} alt={item.book.title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-black text-sm line-clamp-1">{item.book.title}</p>
          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">{whoLabel} @{item.other.username}</p>
        <p className="text-xs text-gray-500">
          {item.loanMode === "READ_TILL_FINISH"
            ? "Return when finished"
            : ret ? `Due back: ${ret}` : null}
        </p>
        <div className="mt-3">
          <Link href={`/swaps/${item.id}`} className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all">
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}

function BookThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="w-11 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Empty({ title, desc, href, cta }: { title: string; desc: string; href: string; cta: string }) {
  return (
    <div className="text-center py-24">
      <p className="text-black font-semibold text-lg mb-2">{title}</p>
      <p className="text-gray-400 text-sm mb-7">{desc}</p>
      <Link href={href} className="inline-block bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-zinc-800 transition-all">
        {cta}
      </Link>
    </div>
  );
}
