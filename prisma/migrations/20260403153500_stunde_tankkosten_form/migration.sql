-- AlterTable
ALTER TABLE "stunden"
ADD COLUMN "tankKosten" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Remove obsolete column
ALTER TABLE "stunden"
DROP COLUMN "tanken";
