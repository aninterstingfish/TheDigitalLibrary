"use client";

type BorrowedEntry = {
  id: string;
  bookTitle: string;
  bookAuthor: string | null;
  ownerUsername: string;
  pickupDate: string | null;
  returnDate: string | null;
  returnConfirmedAt: string | null;
};

type LentEntry = {
  id: string;
  bookTitle: string;
  bookAuthor: string | null;
  borrowerUsername: string;
  pickupDate: string | null;
  returnDate: string | null;
  returnConfirmedAt: string | null;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function HistoryClient({
  userName,
  username,
  borrowed,
  lent,
}: {
  userName: string;
  username: string;
  borrowed: BorrowedEntry[];
  lent: LentEntry[];
}) {
  function handlePrint() {
    window.print();
  }

  const total = borrowed.length + lent.length;

  return (
    <>
      {/* Print button */}
      <div className="flex justify-end mb-6 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Save as PDF
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-black">Borrowing History</h1>
        <p className="text-gray-600 text-sm mt-1">@{username} · {userName} · Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        <p className="text-gray-500 text-sm mt-0.5">{borrowed.length} borrowed · {lent.length} lent</p>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">No completed swaps yet.</p>
          <p className="text-gray-300 text-xs mt-1">Your history will appear here once swaps are completed.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {borrowed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-3 print:text-base">
                Borrowed ({borrowed.length})
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:rounded-none print:border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Book</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">From</th>
                      <th className="text-left px-4 py-3 font-medium">Picked up</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Returned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {borrowed.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-black">{e.bookTitle}</p>
                          {e.bookAuthor && <p className="text-xs text-gray-400">{e.bookAuthor}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">@{e.ownerUsername}</td>
                        <td className="px-4 py-3 text-gray-500">{fmt(e.pickupDate)}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{fmt(e.returnConfirmedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {lent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-3 print:text-base">
                Lent out ({lent.length})
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:rounded-none print:border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Book</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Borrower</th>
                      <th className="text-left px-4 py-3 font-medium">Lent on</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Returned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lent.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-black">{e.bookTitle}</p>
                          {e.bookAuthor && <p className="text-xs text-gray-400">{e.bookAuthor}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">@{e.borrowerUsername}</td>
                        <td className="px-4 py-3 text-gray-500">{fmt(e.pickupDate)}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{fmt(e.returnConfirmedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      <style>{`
        @media print {
          nav, .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
