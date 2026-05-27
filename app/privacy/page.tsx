import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/login" className="flex items-center gap-3 mb-12">
          <BookIcon dark />
          <span className="text-black text-xl font-bold tracking-tight">BookSwap</span>
        </Link>

        <h1 className="text-4xl font-bold text-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated 27 May 2026</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <Section title="1. What We Collect">
            When you register we collect your name, username, email address, and password (stored as a
            secure hash). When you list a book we store the title, author, condition, meet-up spot, and
            optionally a cover photo you upload.
          </Section>

          <Section title="2. How We Use It">
            Your data is used solely to operate BookSwap: matching borrowers with owners, sending
            in-app notifications about swap dates and returns, and calculating your reputation rating.
            We do not sell your data to third parties.
          </Section>

          <Section title="3. Who Can See Your Data">
            Your name, username, profile photo, star ratings, listed books, and swap count are visible
            to other BookSwap users. Your email address and password hash are never shown publicly.
          </Section>

          <Section title="4. Notifications">
            BookSwap may send browser push notifications for swap confirmations, upcoming swap dates,
            return reminders, and overdue alerts. You can disable these in your browser settings at any time.
          </Section>

          <Section title="5. Photos">
            Book cover photos you upload are stored on our servers and displayed publicly on your listing.
            Profile photos are visible to all users. Do not upload images that contain personal or
            sensitive information.
          </Section>

          <Section title="6. Data Retention">
            Your account data is retained for as long as your account is active. You may request account
            deletion by contacting an admin, which will remove your personal information within 30 days.
            Completed swap records may be retained in anonymised form.
          </Section>

          <Section title="7. Cookies">
            BookSwap uses a single session cookie to keep you signed in. No third-party tracking or
            advertising cookies are used.
          </Section>

          <Section title="8. Changes to This Policy">
            We may update this policy as the service grows. We will notify users of significant changes
            via an in-app notification.
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-6 text-sm">
          <Link href="/terms" className="text-black font-semibold hover:underline underline-offset-2">Terms of Service</Link>
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
