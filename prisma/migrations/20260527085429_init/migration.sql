-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "borrowLimit" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "coverPhoto" TEXT,
    "meetUpSpot" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SwapRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedSwapDate" DATETIME NOT NULL,
    "loanDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "counterProposedDate" DATETIME,
    "counterProposedDays" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bookId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    CONSTRAINT "SwapRequest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SwapRequest_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Swap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "swapDate" DATETIME NOT NULL,
    "returnDate" DATETIME NOT NULL,
    "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerConfirmedReturn" BOOLEAN NOT NULL DEFAULT false,
    "borrowerConfirmedReturn" BOOLEAN NOT NULL DEFAULT false,
    "requestId" TEXT NOT NULL,
    CONSTRAINT "Swap_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SwapRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "swapId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    CONSTRAINT "Message_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stars" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "swapId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rateeId" TEXT NOT NULL,
    CONSTRAINT "Rating_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_rateeId_fkey" FOREIGN KEY ("rateeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Swap_requestId_key" ON "Swap"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_swapId_raterId_key" ON "Rating"("swapId", "raterId");
