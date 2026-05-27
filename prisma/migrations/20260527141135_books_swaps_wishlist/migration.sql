/*
  Warnings:

  - You are about to drop the column `meetUpSpot` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `swapDate` on the `Swap` table. All the data in the column will be lost.
  - You are about to drop the column `counterProposedDate` on the `SwapRequest` table. All the data in the column will be lost.
  - You are about to drop the column `counterProposedDays` on the `SwapRequest` table. All the data in the column will be lost.
  - You are about to drop the column `loanDays` on the `SwapRequest` table. All the data in the column will be lost.
  - You are about to drop the column `requestedSwapDate` on the `SwapRequest` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupDate` to the `Swap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedPickupDate` to the `SwapRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Rating" ADD COLUMN "review" TEXT;

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WishlistItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "condition" TEXT NOT NULL,
    "coverPhoto" TEXT,
    "genres" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("author", "condition", "coverPhoto", "createdAt", "id", "isAvailable", "ownerId", "title") SELECT "author", "condition", "coverPhoto", "createdAt", "id", "isAvailable", "ownerId", "title" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE TABLE "new_Swap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pickupDate" DATETIME NOT NULL,
    "returnDate" DATETIME,
    "loanMode" TEXT NOT NULL DEFAULT 'FIXED_DATE',
    "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerConfirmedReturn" BOOLEAN NOT NULL DEFAULT false,
    "borrowerConfirmedReturn" BOOLEAN NOT NULL DEFAULT false,
    "requestId" TEXT NOT NULL,
    CONSTRAINT "Swap_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SwapRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Swap" ("borrowerConfirmedReturn", "confirmedAt", "id", "ownerConfirmedReturn", "requestId", "returnDate") SELECT "borrowerConfirmedReturn", "confirmedAt", "id", "ownerConfirmedReturn", "requestId", "returnDate" FROM "Swap";
DROP TABLE "Swap";
ALTER TABLE "new_Swap" RENAME TO "Swap";
CREATE UNIQUE INDEX "Swap_requestId_key" ON "Swap"("requestId");
CREATE TABLE "new_SwapRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedPickupDate" DATETIME NOT NULL,
    "requestedReturnDate" DATETIME,
    "loanMode" TEXT NOT NULL DEFAULT 'FIXED_DATE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "counterPickupDate" DATETIME,
    "counterReturnDate" DATETIME,
    "counterLoanMode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bookId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    CONSTRAINT "SwapRequest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SwapRequest_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SwapRequest" ("bookId", "borrowerId", "createdAt", "id", "status", "updatedAt") SELECT "bookId", "borrowerId", "createdAt", "id", "status", "updatedAt" FROM "SwapRequest";
DROP TABLE "SwapRequest";
ALTER TABLE "new_SwapRequest" RENAME TO "SwapRequest";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "yearGroup" INTEGER,
    "borrowLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("borrowLimit", "createdAt", "email", "id", "name", "passwordHash", "profilePhoto", "username") SELECT "borrowLimit", "createdAt", "email", "id", "name", "passwordHash", "profilePhoto", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_bookId_key" ON "WishlistItem"("userId", "bookId");
