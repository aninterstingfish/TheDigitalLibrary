import { prisma } from "@/lib/prisma";

export async function getStats() {
  const [bookCount, activeSwapCount, ratingResult] = await Promise.all([
    prisma.book.count({ where: { isAvailable: true } }),
    prisma.swap.count({
      where: {
        returnDate: { gt: new Date() },
        ownerConfirmedReturn: false,
      },
    }),
    prisma.rating.aggregate({ _avg: { stars: true } }),
  ]);

  const avg = ratingResult._avg.stars;
  return {
    books: bookCount,
    activeSwaps: activeSwapCount,
    avgRating: avg ? Math.round(avg * 10) / 10 : null,
  };
}
