-- AlterTable
ALTER TABLE "StudentMaintenanceMathLog" ADD COLUMN "bonusItemId" TEXT;

-- AddForeignKey
ALTER TABLE "StudentMaintenanceMathLog" ADD CONSTRAINT "StudentMaintenanceMathLog_bonusItemId_fkey" FOREIGN KEY ("bonusItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
