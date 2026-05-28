-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "yearGroup" INTEGER,
    "borrowLimit" INTEGER NOT NULL DEFAULT 5,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "parentEmail" TEXT,
    "parentToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("approved", "borrowLimit", "createdAt", "email", "id", "name", "parentEmail", "parentToken", "passwordHash", "profilePhoto", "username", "yearGroup") SELECT "approved", "borrowLimit", "createdAt", "email", "id", "name", "parentEmail", "parentToken", "passwordHash", "profilePhoto", "username", "yearGroup" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_parentToken_key" ON "User"("parentToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
