"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestForm({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"FIXED_DATE" | "READ_TILL_FINISH">("FIXED_DATE");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!pickupDate) { setError("Please select a pickup date."); return; }
    if (mode === "FIXED_DATE" && !returnDate) { setError("Please select a return date."); return; }
    if (mode === "FIXED_DATE" && returnDate <= pickupDate) { setError("Return date must be after pickup date."); return; }

    setIsLoading(true);
    const res = await fetch("/api/swap-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, loanMode: mode, pickupDate, returnDate: mode === "FIXED_DATE" ? returnDate : undefined }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) { setError(data.error || "Something went wrong."); setIsLoading(false); return; }
    router.push("/swaps");
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      {/* Loan mode */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Loan type</label>
        <div className="grid grid-cols-2 gap-2">
          {([["FIXED_DATE", "Fixed dates", "I'll return it by a set date"], ["READ_TILL_FINISH", "Read till finish", "I'll return it when I'm done"]] as const).map(([val, label, desc]) => (
            <button key={val} type="button" onClick={() => setMode(val)}
              className={`p-3 rounded-xl border text-left transition-all ${mode === val ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400"}`}>
              <p className={`text-sm font-semibold ${mode === val ? "text-white" : "text-black"}`}>{label}</p>
              <p className={`text-xs mt-0.5 ${mode === val ? "text-white/70" : "text-gray-400"}`}>{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pickup date */}
      <div>
        <label htmlFor="pickup" className="block text-sm font-medium text-black mb-1.5">Pickup date</label>
        <input id="pickup" type="date" min={today} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)}
          className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
      </div>

      {/* Return date (fixed mode only) */}
      {mode === "FIXED_DATE" && (
        <div>
          <label htmlFor="return" className="block text-sm font-medium text-black mb-1.5">Return date</label>
          <input id="return" type="date" min={pickupDate || today} value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          <span className="shrink-0">⚠</span><span>{error}</span>
        </div>
      )}

      <button type="submit" disabled={isLoading}
        className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? "Sending request…" : "Send request"}
      </button>
    </form>
  );
}
