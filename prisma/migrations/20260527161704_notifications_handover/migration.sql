-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Swap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pickupDate" DATETIME NOT NULL,
    "returnDate" DATETIME,
    "loanMode" TEXT NOT NULL DEFAULT 'FIXED_DATE',
    "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handedOver" BOOLEAN NOT NULL DEFAULT false,
    "ownerConfirmedReturn" BOOLEAN NOT NULL DEFAULT false,
    "borrowerConfirmedReturn" BOOLEAN NOT NULL DEFAULT false,
    "returnConfirmedAt" DATETIME,
    "requestId" TEXT NOT NULL,
    CONSTRAINT "Swap_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SwapRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Swap" ("borrowerConfirmedReturn", "confirmedAt", "id", "loanMode", "ownerConfirmedReturn", "pickupDate", "requestId", "returnDate") SELECT "borrowerConfirmedReturn", "confirmedAt", "id", "loanMode", "ownerConfirmedReturn", "pickupDate", "requestId", "returnDate" FROM "Swap";
DROP TABLE "Swap";
ALTER TABLE "new_Swap" RENAME TO "Swap";
CREATE UNIQUE INDEX "Swap_requestId_key" ON "Swap"("requestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
