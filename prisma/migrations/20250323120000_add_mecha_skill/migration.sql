-- CreateEnum
CREATE TYPE "MechaSkillKind" AS ENUM ('ATTACK', 'DEFENSE', 'BUFF', 'HEAL', 'CONTROL', 'SUPPORT');

-- CreateTable
CREATE TABLE "MechaSkill" (
    "id" TEXT NOT NULL,
    "mechaId" TEXT NOT NULL,
    "unlockLevel" INTEGER NOT NULL,
    "kind" "MechaSkillKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MechaSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MechaSkill_mechaId_unlockLevel_key" ON "MechaSkill"("mechaId", "unlockLevel");

-- CreateIndex
CREATE UNIQUE INDEX "MechaSkill_mechaId_slug_key" ON "MechaSkill"("mechaId", "slug");

-- CreateIndex
CREATE INDEX "MechaSkill_mechaId_idx" ON "MechaSkill"("mechaId");

-- CreateIndex
CREATE INDEX "MechaSkill_kind_idx" ON "MechaSkill"("kind");

-- AddForeignKey
ALTER TABLE "MechaSkill" ADD CONSTRAINT "MechaSkill_mechaId_fkey" FOREIGN KEY ("mechaId") REFERENCES "Mecha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MechaSkill" ADD CONSTRAINT "MechaSkill_unlockLevel_check" CHECK ("unlockLevel" IN (2, 5, 7));
