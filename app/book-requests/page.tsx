import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import BookRequestsClient from "./BookRequestsClient";

export default async function BookRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const requests = await prisma.bookRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, author: true, fulfilled: true, createdAt: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/book-requests" />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black mb-1">Book requests</h1>
          <p className="text-gray-500 text-sm">Can&apos;t find a book in the catalogue? Request it and we&apos;ll notify you when someone lists it.</p>
        </div>
        <BookRequestsClient initialRequests={requests} />
      </div>
    </div>
  );
}
