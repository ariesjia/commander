-- AlterTable
ALTER TABLE "Parent" ADD COLUMN "drivingGuideEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "StudentDrivingGuideLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "completedOn" DATE NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatorId" TEXT NOT NULL,
    "sessionHash" TEXT,

    CONSTRAINT "StudentDrivingGuideLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentDrivingGuideLog_studentId_idx" ON "StudentDrivingGuideLog"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentDrivingGuideLog_studentId_completedOn_key" ON "StudentDrivingGuideLog"("studentId", "completedOn");

-- AddForeignKey
ALTER TABLE "StudentDrivingGuideLog" ADD CONSTRAINT "StudentDrivingGuideLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
