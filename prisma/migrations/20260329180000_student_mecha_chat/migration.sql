-- CreateEnum
CREATE TYPE "MechaChatRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN "mechaChatEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "MechaChatSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mechaSlug" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MechaChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MechaChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MechaChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MechaChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MechaChatSession_studentId_updatedAt_idx" ON "MechaChatSession"("studentId", "updatedAt");

-- CreateIndex
CREATE INDEX "MechaChatMessage_sessionId_createdAt_idx" ON "MechaChatMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "MechaChatSession" ADD CONSTRAINT "MechaChatSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechaChatMessage" ADD CONSTRAINT "MechaChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MechaChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
