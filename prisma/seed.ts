import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: "alice@school.edu" },
    update: {},
    create: { username: "alice_r", email: "alice@school.edu", passwordHash: "placeholder", name: "Alice Roberts", borrowLimit: 5 },
  });
  const ben = await prisma.user.upsert({
    where: { email: "ben@school.edu" },
    update: {},
    create: { username: "ben_k", email: "ben@school.edu", passwordHash: "placeholder", name: "Ben Khan", borrowLimit: 5 },
  });
  const chloe = await prisma.user.upsert({
    where: { email: "chloe@school.edu" },
    update: {},
    create: { username: "chloe_m", email: "chloe@school.edu", passwordHash: "placeholder", name: "Chloe Martinez", borrowLimit: 5 },
  });

  const books = await Promise.all([
    prisma.book.create({ data: { title: "To Kill a Mockingbird", author: "Harper Lee", condition: "NEW", genres: JSON.stringify(["Fiction"]), ownerId: alice.id } }),
    prisma.book.create({ data: { title: "1984", author: "George Orwell", condition: "MINOR_WEAR", genres: JSON.stringify(["Fiction", "Science"]), ownerId: alice.id } }),
    prisma.book.create({ data: { title: "The Great Gatsby", author: "F. Scott Fitzgerald", condition: "MAJOR_WEAR", genres: JSON.stringify(["Fiction"]), ownerId: ben.id } }),
    prisma.book.create({ data: { title: "Brave New World", author: "Aldous Huxley", condition: "MINOR_WEAR", genres: JSON.stringify(["Fiction", "Science"]), ownerId: ben.id } }),
    prisma.book.create({ data: { title: "Fahrenheit 451", author: "Ray Bradbury", condition: "NEW", genres: JSON.stringify(["Fiction"]), ownerId: chloe.id } }),
    prisma.book.create({ data: { title: "Of Mice and Men", author: "John Steinbeck", condition: "MINOR_WEAR", genres: JSON.stringify(["Fiction"]), ownerId: chloe.id, isAvailable: false } }),
  ]);

  const req1 = await prisma.swapRequest.create({
    data: { bookId: books[5].id, borrowerId: alice.id, requestedPickupDate: new Date("2026-06-01"), requestedReturnDate: new Date("2026-06-15"), loanMode: "FIXED_DATE", status: "ACCEPTED" },
  });
  await prisma.swap.create({
    data: { requestId: req1.id, pickupDate: new Date("2026-06-01"), returnDate: new Date("2026-06-15"), loanMode: "FIXED_DATE" },
  });

  const req2 = await prisma.swapRequest.create({
    data: { bookId: books[0].id, borrowerId: ben.id, requestedPickupDate: new Date("2026-05-01"), requestedReturnDate: new Date("2026-05-08"), loanMode: "FIXED_DATE", status: "COMPLETED" },
  });
  const oldSwap = await prisma.swap.create({
    data: { requestId: req2.id, pickupDate: new Date("2026-05-01"), returnDate: new Date("2026-05-08"), loanMode: "FIXED_DATE", ownerConfirmedReturn: true, borrowerConfirmedReturn: true },
  });

  await prisma.rating.createMany({
    data: [
      { swapId: oldSwap.id, raterId: alice.id, rateeId: ben.id, stars: 5, role: "AS_OWNER" },
      { swapId: oldSwap.id, raterId: ben.id, rateeId: alice.id, stars: 4, role: "AS_BORROWER" },
    ],
  });

  console.log("Seed complete:", { users: 3, books: books.length });
}

main().catch(console.error).finally(() => prisma.$disconnect());
