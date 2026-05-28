import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import EditBookForm from "./EditBookForm";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    select: { id: true, title: true, author: true, series: true, seriesNumber: true, condition: true, genres: true, tags: true, labelType: true, description: true, coverPhoto: true, ownerId: true, isCurrentlyReading: true },
  });

  if (!book) notFound();
  if (book.ownerId !== session.userId) redirect("/catalogue");

  const genres: string[] = (() => { try { return JSON.parse(book.genres); } catch { return []; } })();
  const tags: string[] = (() => { try { return JSON.parse(book.tags); } catch { return []; } })();

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">Edit listing</h1>
        <p className="text-gray-500 text-sm mb-8">Update your book details.</p>
        <EditBookForm
          id={book.id}
          initial={{
            title: book.title,
            author: book.author ?? "",
            series: book.series ?? "",
            seriesNumber: book.seriesNumber?.toString() ?? "",
            condition: book.condition,
            genres,
            tags,
            labelType: book.labelType,
            description: book.description ?? "",
            coverPhoto: book.coverPhoto,
            isCurrentlyReading: book.isCurrentlyReading,
          }}
        />
      </main>
    </div>
  );
}
