import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/login" className="flex items-center gap-3 mb-12">
          <BookIcon dark />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>

        <h1 className="text-4xl font-bold text-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated 27 May 2026</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <Section title="1. Acceptance">
            By creating a Cloud Library account you agree to these terms. If you do not agree, do not use the service.
          </Section>

          <Section title="2. Eligibility">
            Cloud Library is intended for students at registered schools. You must be 13 or older to use the service.
          </Section>

          <Section title="3. Book Listings">
            You may only list books you own. Listings must be accurate — the photo, condition, and title must represent
            the actual book. Misleading listings may result in account suspension.
          </Section>

          <Section title="4. Swaps &amp; Returns">
            Once a swap is confirmed, both parties are expected to meet at the agreed location and time.
            Borrowers must return books by the agreed return date. Repeated failures to return books on time
            will reduce your borrow limit.
          </Section>

          <Section title="5. Ratings">
            Ratings are left after the swap date. Both owners and borrowers can rate each other 1–5 stars.
            Ratings must be honest. Abusive or retaliatory ratings may be removed by an admin.
          </Section>

          <Section title="6. Prohibited Conduct">
            You may not use Cloud Library to harass other users, list stolen or counterfeit material, or circumvent
            the swap system. Violations may result in permanent account termination.
          </Section>

          <Section title="7. Limitation of Liability">
            Cloud Library is not responsible for lost, damaged, or unreturned books. Disputes between users are
            the responsibility of the users involved, with teacher/admin mediation available.
          </Section>

          <Section title="8. Changes to Terms">
            We may update these terms from time to time. Continued use of Cloud Library after changes constitutes
            acceptance of the updated terms.
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-6 text-sm">
          <Link href="/privacy" className="text-black font-semibold hover:underline underline-offset-2">Privacy Policy</Link>
          <Link href="/login" className="text-gray-400 hover:text-black transition-colors">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-black font-semibold text-base mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function BookIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="28" height="28" rx="7" fill={dark ? "#000" : "#fff"} />
      <path d="M8 8h7a3 3 0 013 3v9a3 3 0 01-3 3H8V8z" fill={dark ? "#fff" : "#000"} />
      <path d="M15 8h1a3 3 0 013 3v9a3 3 0 01-3 3h-1" stroke={dark ? "#fff" : "#000"} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
