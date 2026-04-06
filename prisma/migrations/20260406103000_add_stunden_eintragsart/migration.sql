-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stunden" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datum" DATETIME NOT NULL,
    "beginn" TEXT NOT NULL,
    "ende" TEXT NOT NULL,
    "pauseDauer" INTEGER NOT NULL DEFAULT 0,
    "stundenGes" REAL NOT NULL,
    "baustellen" TEXT NOT NULL,
    "eintragsart" TEXT NOT NULL DEFAULT 'TAGESEINSATZ',
    "tankKosten" REAL NOT NULL DEFAULT 0,
    "bildNotizPfad" TEXT,
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
    "baustellen",
    "eintragsart",
    "tankKosten",
    "bildNotizPfad",
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
    CASE
        WHEN "uebernachtung" = 1 THEN 'UEBERNACHTUNG'
        ELSE 'TAGESEINSATZ'
    END,
    "tankKosten",
    "bildNotizPfad",
    "createdAt",
    "updatedAt"
FROM "stunden";
DROP TABLE "stunden";
ALTER TABLE "new_stunden" RENAME TO "stunden";
CREATE INDEX "stunden_datum_idx" ON "stunden"("datum");
CREATE INDEX "stunden_baustellen_idx" ON "stunden"("baustellen");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
