import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true, email: true, yearGroup: true, profilePhoto: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">Settings</h1>
        <p className="text-gray-500 text-sm mb-8">Update your profile and account details.</p>
        <SettingsForm user={user} />
      </main>
    </div>
  );
}
