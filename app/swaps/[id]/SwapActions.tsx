"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "PENDING" | "COUNTER" | "ACCEPTED_AWAITING" | "ACTIVE" | "RETURN_PENDING" | "RATING" | "DONE" | "CLOSED";

export default function SwapActions({
  requestId, swapId, phase, isOwner, isBorrower, loanMode,
  myRating, theirRating, borrowerConfirmedReturn, requestStatus,
}: {
  requestId: string; swapId: string | null; phase: Phase;
  isOwner: boolean; isBorrower: boolean; loanMode: string;
  myRating: { stars: number; review: string | null } | null;
  theirRating: { stars: number } | null;
  borrowerConfirmedReturn: boolean;
  requestStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [showNoShow, setShowNoShow] = useState(false);
  const [handedOverDone, setHandedOverDone] = useState(false);
  const [counterPickup, setCounterPickup] = useState("");
  const [counterReturn, setCounterReturn] = useState("");
  const [counterMode, setCounterMode] = useState<"FIXED_DATE" | "READ_TILL_FINISH">("FIXED_DATE");
  const [noShowBlame, setNoShowBlame] = useState("");
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [err, setErr] = useState("");
  const today = new Date().toISOString().split("T")[0];

  async function call(url: string, body?: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    return { ok: res.ok, data: text ? JSON.parse(text) : {} };
  }

  async function act(key: string, fn: () => Promise<void>) {
    setLoading(key); setErr("");
    try { await fn(); router.refresh(); } catch { setErr("Something went wrong."); }
    setLoading("");
  }

  if (phase === "CLOSED") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
        <p className="text-gray-500 text-sm">This request was {requestStatus === "REJECTED" ? "declined" : "cancelled"}.</p>
      </div>
    );
  }

  if (phase === "DONE") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center space-y-2">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="font-semibold text-black">Swap complete!</p>
        {myRating && <p className="text-sm text-gray-400">You gave {myRating.stars} star{myRating.stars !== 1 ? "s" : ""}.</p>}
        {theirRating && <p className="text-sm text-gray-400">They gave you {theirRating.stars} star{theirRating.stars !== 1 ? "s" : ""}.</p>}
      </div>
    );
  }

  if (phase === "RATING") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-black">Rate this swap</h2>
        <div className="flex gap-2">
          {[1,2,3,4,5].map((n) => (
            <button key={n} type="button" onClick={() => setStars(n)}
              className={`text-2xl transition-transform hover:scale-110 ${n <= stars ? "text-amber-400" : "text-gray-200"}`}>★</button>
          ))}
        </div>
        <textarea value={review} onChange={(e) => setReview(e.target.value)} maxLength={1000}
          placeholder="Optional review (max 1000 characters)…" rows={3}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none" />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button disabled={stars === 0 || loading === "rate"}
          onClick={() => act("rate", async () => {
            const r = await call(`/api/swaps/${swapId}/rate`, { stars, review: review || undefined });
            if (!r.ok) throw new Error(r.data.error);
          })}
          className="w-full bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading === "rate" ? "Submitting…" : "Submit rating"}
        </button>
      </div>
    );
  }

  if (phase === "ACTIVE") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Active loan</p>
        {err && <p className="text-red-500 text-sm">{err}</p>}
        {isOwner && (
          <button disabled={loading === "return-owner"}
            onClick={() => act("return-owner", async () => {
              const r = await call(`/api/swaps/${swapId}/return`, { confirmedBy: "owner" });
              if (!r.ok) throw new Error(r.data.error);
            })}
            className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50">
            {loading === "return-owner" ? "Confirming…" : "I got it back ✓"}
          </button>
        )}
        {isBorrower && loanMode === "READ_TILL_FINISH" && !borrowerConfirmedReturn && (
          <button disabled={loading === "return-borrower"}
            onClick={() => act("return-borrower", async () => {
              const r = await call(`/api/swaps/${swapId}/return`, { confirmedBy: "borrower" });
              if (!r.ok) throw new Error(r.data.error);
            })}
            className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50">
            {loading === "return-borrower" ? "Notifying owner…" : "I've finished reading"}
          </button>
        )}
        {isBorrower && borrowerConfirmedReturn && (
          <p className="text-sm text-gray-500 text-center py-2">You&apos;ve notified the owner — waiting for them to confirm receipt.</p>
        )}
      </div>
    );
  }

  if (phase === "ACCEPTED_AWAITING") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Awaiting handover</p>
        {err && <p className="text-red-500 text-sm">{err}</p>}

        {isOwner && !handedOverDone && !showNoShow && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Did the swap happen? Did you hand over the book?</p>
            <div className="flex gap-2">
              <button disabled={loading === "yes"}
                onClick={() => act("yes", async () => {
                  const r = await call(`/api/swaps/${swapId}/handover`, { happened: true });
                  if (!r.ok) throw new Error(r.data.error);
                  setHandedOverDone(true);
                })}
                className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50">
                {loading === "yes" ? "…" : "Yes ✓"}
              </button>
              <button type="button" onClick={() => setShowNoShow(true)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">
                No
              </button>
            </div>
          </div>
        )}

        {isOwner && handedOverDone && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✓</div>
            <p className="font-semibold text-black">Handover confirmed!</p>
            <p className="text-sm text-gray-400 mt-1">The loan is now active.</p>
          </div>
        )}

        {isOwner && showNoShow && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-black">What happened?</p>
            {[["borrower", "Borrower forgot / didn't show up"], ["owner", "I forgot / wasn't available"], ["mutual", "Mutual agreement to cancel"], ["other", "Other"]].map(([val, label]) => (
              <label key={val} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="blame" value={val} checked={noShowBlame === val} onChange={() => setNoShowBlame(val)} className="accent-black" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
            <button disabled={!noShowBlame || loading === "noshow"}
              onClick={() => act("noshow", async () => {
                const r = await call(`/api/swaps/${swapId}/handover`, { happened: false, blame: noShowBlame });
                if (!r.ok) throw new Error(r.data.error);
              })}
              className="w-full bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading === "noshow" ? "Submitting…" : "Submit"}
            </button>
          </div>
        )}

        {isBorrower && (
          <p className="text-sm text-gray-500 text-center py-2">Request accepted — waiting for the owner to confirm the handover.</p>
        )}
      </div>
    );
  }

  if (phase === "COUNTER") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Counter offer received</p>
        {err && <p className="text-red-500 text-sm">{err}</p>}
        {isBorrower && (
          <div className="flex gap-2">
            <button disabled={loading === "accept-counter"}
              onClick={() => act("accept-counter", async () => {
                const r = await call(`/api/swap-requests/${requestId}/respond`, { accept: true });
                if (!r.ok) throw new Error(r.data.error);
              })}
              className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50">
              {loading === "accept-counter" ? "…" : "Accept offer"}
            </button>
            <button disabled={loading === "reject-counter"}
              onClick={() => act("reject-counter", async () => {
                const r = await call(`/api/swap-requests/${requestId}/respond`, { accept: false });
                if (!r.ok) throw new Error(r.data.error);
              })}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50">
              {loading === "reject-counter" ? "…" : "Decline"}
            </button>
          </div>
        )}
        {isOwner && <p className="text-sm text-gray-500 text-center py-2">Counter offer sent — waiting for borrower to respond.</p>}
      </div>
    );
  }

  // PENDING
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Pending request</p>
      {err && <p className="text-red-500 text-sm">{err}</p>}

      {isOwner && !showCounter && (
        <div className="space-y-2">
          <button disabled={loading === "accept"}
            onClick={() => act("accept", async () => {
              const r = await call(`/api/swap-requests/${requestId}/accept`);
              if (!r.ok) throw new Error(r.data.error);
            })}
            className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50">
            {loading === "accept" ? "Accepting…" : "Accept"}
          </button>
          <button type="button" onClick={() => setShowCounter(true)}
            className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">
            Counter offer
          </button>
          <button disabled={loading === "reject"}
            onClick={() => act("reject", async () => {
              const r = await call(`/api/swap-requests/${requestId}/reject`);
              if (!r.ok) throw new Error(r.data.error);
            })}
            className="w-full text-red-500 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-all disabled:opacity-50">
            {loading === "reject" ? "Declining…" : "Decline"}
          </button>
        </div>
      )}

      {isOwner && showCounter && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-black">Propose new terms</p>
          <div className="grid grid-cols-2 gap-2">
            {(["FIXED_DATE", "READ_TILL_FINISH"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setCounterMode(m)}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${counterMode === m ? "border-black bg-black text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}>
                {m === "FIXED_DATE" ? "Fixed dates" : "Read till finish"}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Pickup date</label>
            <input type="date" min={today} value={counterPickup} onChange={(e) => setCounterPickup(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          {counterMode === "FIXED_DATE" && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Return date</label>
              <input type="date" min={counterPickup || today} value={counterReturn} onChange={(e) => setCounterReturn(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
          )}
          <div className="flex gap-2">
            <button disabled={!counterPickup || loading === "counter"}
              onClick={() => act("counter", async () => {
                const r = await call(`/api/swap-requests/${requestId}/counter`, { pickupDate: counterPickup, returnDate: counterMode === "FIXED_DATE" ? counterReturn : undefined, loanMode: counterMode });
                if (!r.ok) throw new Error(r.data.error);
                setShowCounter(false);
              })}
              className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading === "counter" ? "Sending…" : "Send counter offer"}
            </button>
            <button type="button" onClick={() => setShowCounter(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isBorrower && (
        <p className="text-sm text-gray-500 text-center py-2">Request sent — waiting for the owner to respond.</p>
      )}
    </div>
  );
}
