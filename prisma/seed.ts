import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { pathToFileURL } from "url";
import path from "path";

const dbUrl = pathToFileURL(path.join(process.cwd(), "dev.db")).href;
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Users
  const alice = await prisma.user.upsert({
    where: { email: "alice@school.edu" },
    update: {},
    create: {
      username: "alice_r",
      email: "alice@school.edu",
      passwordHash: "placeholder",
      name: "Alice Roberts",
      borrowLimit: 3,
    },
  });

  const ben = await prisma.user.upsert({
    where: { email: "ben@school.edu" },
    update: {},
    create: {
      username: "ben_k",
      email: "ben@school.edu",
      passwordHash: "placeholder",
      name: "Ben Khan",
      borrowLimit: 3,
    },
  });

  const chloe = await prisma.user.upsert({
    where: { email: "chloe@school.edu" },
    update: {},
    create: {
      username: "chloe_m",
      email: "chloe@school.edu",
      passwordHash: "placeholder",
      name: "Chloe Martinez",
      borrowLimit: 3,
    },
  });

  // Books
  const books = await Promise.all([
    prisma.book.create({
      data: { title: "To Kill a Mockingbird", author: "Harper Lee",       condition: "GOOD", meetUpSpot: "Library front desk", ownerId: alice.id },
    }),
    prisma.book.create({
      data: { title: "1984",                  author: "George Orwell",     condition: "NEW",  meetUpSpot: "Room 14B",           ownerId: alice.id },
    }),
    prisma.book.create({
      data: { title: "The Great Gatsby",      author: "F. Scott Fitzgerald", condition: "WORN", meetUpSpot: "Reception",        ownerId: ben.id },
    }),
    prisma.book.create({
      data: { title: "Brave New World",       author: "Aldous Huxley",    condition: "GOOD", meetUpSpot: "Library front desk", ownerId: ben.id },
    }),
    prisma.book.create({
      data: { title: "Fahrenheit 451",        author: "Ray Bradbury",     condition: "NEW",  meetUpSpot: "Room 14B",           ownerId: chloe.id },
    }),
    prisma.book.create({
      data: { title: "Of Mice and Men",       author: "John Steinbeck",   condition: "GOOD", meetUpSpot: "Canteen",            ownerId: chloe.id, isAvailable: false },
    }),
  ]);

  // One active swap (Of Mice and Men is unavailable)
  const request = await prisma.swapRequest.create({
    data: {
      bookId:           books[5].id,
      borrowerId:       alice.id,
      requestedSwapDate: new Date("2026-06-01"),
      loanDays:         14,
      status:           "ACCEPTED",
    },
  });

  const swap = await prisma.swap.create({
    data: {
      requestId:  request.id,
      swapDate:   new Date("2026-06-01"),
      returnDate: new Date("2026-06-15"),
    },
  });

  // A completed swap with ratings
  const oldRequest = await prisma.swapRequest.create({
    data: {
      bookId:            books[0].id,
      borrowerId:        ben.id,
      requestedSwapDate: new Date("2026-05-01"),
      loanDays:          7,
      status:            "COMPLETED",
    },
  });

  const oldSwap = await prisma.swap.create({
    data: {
      requestId:               oldRequest.id,
      swapDate:                new Date("2026-05-01"),
      returnDate:              new Date("2026-05-08"),
      ownerConfirmedReturn:    true,
      borrowerConfirmedReturn: true,
    },
  });

  await prisma.rating.createMany({
    data: [
      { swapId: oldSwap.id, raterId: alice.id, rateeId: ben.id,   stars: 5, role: "AS_OWNER" },
      { swapId: oldSwap.id, raterId: ben.id,   rateeId: alice.id, stars: 4, role: "AS_BORROWER" },
    ],
  });

  console.log("Seed complete:", {
    users: 3,
    books: books.length,
    activeSwaps: 1,
    completedSwaps: 1,
    ratings: 2,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
