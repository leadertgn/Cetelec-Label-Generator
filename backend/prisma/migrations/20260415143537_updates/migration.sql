-- AlterTable
ALTER TABLE "Project" ADD COLUMN "logoUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Label_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Label" ("createdAt", "id", "sectionId", "text", "updatedAt") SELECT "createdAt", "id", "sectionId", "text", "updatedAt" FROM "Label";
DROP TABLE "Label";
ALTER TABLE "new_Label" RENAME TO "Label";
CREATE TABLE "new_Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "defaultWidth" REAL NOT NULL DEFAULT 20,
    "defaultHeight" REAL NOT NULL DEFAULT 15,
    "bgColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "borderSize" REAL NOT NULL DEFAULT 0.5,
    "borderColor" TEXT NOT NULL DEFAULT '#000000',
    "borderRadius" REAL NOT NULL DEFAULT 1,
    "spacing" REAL NOT NULL DEFAULT 3,
    "fontSize" REAL NOT NULL DEFAULT 8,
    "fontFamily" TEXT NOT NULL DEFAULT 'sans-serif',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Section" ("bgColor", "borderColor", "borderRadius", "borderSize", "createdAt", "defaultHeight", "defaultWidth", "id", "name", "projectId", "spacing", "textColor", "updatedAt") SELECT "bgColor", "borderColor", "borderRadius", "borderSize", "createdAt", "defaultHeight", "defaultWidth", "id", "name", "projectId", "spacing", "textColor", "updatedAt" FROM "Section";
DROP TABLE "Section";
ALTER TABLE "new_Section" RENAME TO "Section";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
