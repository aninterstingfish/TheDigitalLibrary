CREATE TABLE "ConsentRequest" (
  "id"           TEXT     NOT NULL PRIMARY KEY,
  "token"        TEXT     NOT NULL UNIQUE,
  "expiresAt"    DATETIME NOT NULL,
  "name"         TEXT     NOT NULL,
  "username"     TEXT     NOT NULL,
  "childEmail"   TEXT,
  "passwordHash" TEXT     NOT NULL,
  "parentEmail"  TEXT     NOT NULL,
  "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
