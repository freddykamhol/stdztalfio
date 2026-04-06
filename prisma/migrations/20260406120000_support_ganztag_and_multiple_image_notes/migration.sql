-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TEMP TABLE "_stunden_bild_notizen_temp" AS
SELECT
    lower(hex(randomblob(12))) AS "id",
    "id" AS "stundeId",
    'Bild-Notiz' AS "titel",
    "bildNotizPfad" AS "bildPfad",
    0 AS "position",
    "createdAt" AS "createdAt",
    "updatedAt" AS "updatedAt"
FROM "stunden"
WHERE "bildNotizPfad" IS NOT NULL;

CREATE TABLE "new_stunden" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datum" DATETIME NOT NULL,
    "beginn" TEXT,
    "ende" TEXT,
    "pauseDauer" INTEGER NOT NULL DEFAULT 0,
    "stundenGes" REAL NOT NULL DEFAULT 0,
    "bemerkung" TEXT NOT NULL,
    "eintragsart" TEXT NOT NULL DEFAULT 'TAGESEINSATZ',
    "tankKosten" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_stunden" (
    "id",
    "datum",
    "beginn",
    "ende",
    "pauseDauer",
    "stundenGes",
    "bemerkung",
    "eintragsart",
    "tankKosten",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "datum",
    "beginn",
    "ende",
    "pauseDauer",
    "stundenGes",
    "baustellen",
    "eintragsart",
    "tankKosten",
    "createdAt",
    "updatedAt"
FROM "stunden";

DROP TABLE "stunden";
ALTER TABLE "new_stunden" RENAME TO "stunden";

CREATE TABLE "stunden_bild_notizen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stundeId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "bildPfad" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stunden_bild_notizen_stundeId_fkey" FOREIGN KEY ("stundeId") REFERENCES "stunden" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "stunden_bild_notizen" (
    "id",
    "stundeId",
    "titel",
    "bildPfad",
    "position",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "stundeId",
    "titel",
    "bildPfad",
    "position",
    "createdAt",
    "updatedAt"
FROM "_stunden_bild_notizen_temp";

DROP TABLE "_stunden_bild_notizen_temp";

CREATE INDEX "stunden_datum_idx" ON "stunden"("datum");
CREATE INDEX "stunden_bemerkung_idx" ON "stunden"("bemerkung");
CREATE INDEX "stunden_bild_notizen_stundeId_position_idx" ON "stunden_bild_notizen"("stundeId", "position");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
