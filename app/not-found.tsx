import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-8xl font-bold text-black mb-4">404</p>
        <p className="text-gray-500 text-lg mb-8">This page doesn&apos;t exist.</p>
        <Link href="/dashboard" className="inline-block bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-zinc-800 transition-all">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
