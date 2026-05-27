import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import ListBookForm from "./ListBookForm";

export default async function ListBookPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav active="/books/new" />
      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-1">List a book</h1>
        <p className="text-gray-500 text-sm mb-8">Share a book you own and let other students borrow it.</p>
        <ListBookForm />
      </main>
    </div>
  );
}
