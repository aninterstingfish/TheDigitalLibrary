import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/login" className="flex items-center gap-3 mb-12">
          <CloudBookIcon />
          <span className="text-black text-xl font-bold tracking-tight">Cloud Library</span>
        </Link>

        <h1 className="text-4xl font-bold text-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated 27 May 2026 · Applies to UK &amp; EU users</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
          <Section title="1. Who We Are (Data Controller)">
            Cloud Library is operated as a school book-sharing service. For questions about your data or
            to exercise your rights, contact your school administrator or email{" "}
            <span className="text-black font-medium">privacy@cloudlibrary.school</span>.
          </Section>

          <Section title="2. What We Collect">
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong className="text-black">Account data:</strong> your full name, username, email address, and a bcrypt hash of your password (your real password is never stored).</li>
              <li><strong className="text-black">Profile data:</strong> year group and profile photo (both optional).</li>
              <li><strong className="text-black">Book listings:</strong> title, author, condition, description, genres, and cover photo.</li>
              <li><strong className="text-black">Swap activity:</strong> loan requests, agreed dates, handover confirmations, and return records.</li>
              <li><strong className="text-black">Ratings &amp; reviews:</strong> star ratings and optional text reviews you write or receive.</li>
              <li><strong className="text-black">Wishlist:</strong> which books you have saved.</li>
              <li><strong className="text-black">Notifications:</strong> in-app messages about your swap activity.</li>
            </ul>
          </Section>

          <Section title="3. Lawful Basis for Processing">
            We process your data on the basis of <strong className="text-black">contractual necessity</strong> — it is required
            to provide the Cloud Library service (creating your account, managing swaps, and calculating
            your reputation). Where you have provided optional data (profile photo, year group), we rely
            on your <strong className="text-black">consent</strong>, which you may withdraw at any time via Settings.
          </Section>

          <Section title="4. How We Use Your Data">
            Your data is used solely to operate Cloud Library: matching borrowers with book owners,
            confirming swap dates, sending in-app notifications, and calculating leaderboard rankings.
            We do not sell, rent, or share your data with third parties or use it for advertising.
          </Section>

          <Section title="5. What Other Users Can See">
            Your name, username, profile photo, year group, star rating, listed books, and completed
            swap count are visible to other signed-in users of Cloud Library. Your email address and
            password hash are never shown to anyone.
          </Section>

          <Section title="6. Cookies">
            Cloud Library uses a single <strong className="text-black">strictly necessary session cookie</strong> to keep
            you signed in. This cookie expires after 7 days. No advertising, analytics, or third-party
            tracking cookies are used. Strictly necessary cookies are exempt from GDPR consent requirements.
          </Section>

          <Section title="7. Data Retention">
            Your data is retained for as long as your account is active. When you delete your account
            (Settings → Danger Zone), all of your personal data — including your profile, books, swap
            history, ratings, and notifications — is permanently and immediately deleted. We do not
            retain anonymised copies after deletion.
          </Section>

          <Section title="8. Age &amp; Parental Consent">
            Cloud Library requires users to be <strong className="text-black">13 or older</strong> (UK GDPR minimum age of digital
            consent). Users aged 13–15 in EU member states that set the age of consent at 16 should
            obtain parental or guardian consent before registering. By ticking the age confirmation box
            at signup you confirm this.
          </Section>

          <Section title="9. Your Rights Under GDPR">
            You have the following rights regarding your personal data:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-black">Right of access</strong> — request a copy of the data we hold about you.</li>
              <li><strong className="text-black">Right to rectification</strong> — correct inaccurate data via Settings at any time.</li>
              <li><strong className="text-black">Right to erasure</strong> — delete your account and all data via Settings → Danger Zone.</li>
              <li><strong className="text-black">Right to data portability</strong> — download all your data as a JSON file via Settings → Privacy &amp; Data.</li>
              <li><strong className="text-black">Right to object</strong> — object to processing by contacting us at the address in Section 1.</li>
              <li><strong className="text-black">Right to withdraw consent</strong> — remove optional data (photo, year group) in Settings at any time.</li>
            </ul>
            To exercise rights that are not available in-app, contact us using the details in Section 1.
            We will respond within 30 days.
          </Section>

          <Section title="10. Data Security">
            Passwords are stored as bcrypt hashes (never in plain text). Sessions use signed JWT tokens
            in HTTP-only cookies. Uploaded photos are stored on the server and served only to
            authenticated users. We apply reasonable technical measures to protect your data.
          </Section>

          <Section title="11. Changes to This Policy">
            We will notify users of material changes to this policy via an in-app notification at least
            14 days before they take effect. Continued use of Cloud Library after that date constitutes
            acceptance of the updated policy.
          </Section>

          <Section title="12. Complaints">
            If you believe we have handled your data unlawfully, you have the right to lodge a complaint
            with the UK Information Commissioner&apos;s Office (ICO) at <span className="text-black font-medium">ico.org.uk</span> or,
            for EU users, with your national supervisory authority.
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
      <div>{children}</div>
    </div>
  );
}

function CloudBookIcon() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="11" cy="17" r="6" fill="#000" />
      <circle cx="18" cy="12" r="7" fill="#000" />
      <circle cx="25" cy="17" r="6" fill="#000" />
      <rect x="5" y="17" width="26" height="8" rx="4" fill="#000" />
      <path d="M18 16 L12 17.5 L12 23 L18 22 Z" fill="#fff" />
      <path d="M18 16 L24 17.5 L24 23 L18 22 Z" fill="#fff" />
    </svg>
  );
}
