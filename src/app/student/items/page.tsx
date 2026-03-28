"use client";

import { useData } from "@/contexts/DataContext";
import { ItemInventoryPage } from "@/components/items/ItemInventoryPage";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";

export default function StudentItemsPage() {
  const { showPinyin } = useData();

  return (
    <div className="flex flex-col gap-5 pb-6">
      <StudentPageHeader title="道具库" />

      <ItemInventoryPage showPinyin={showPinyin} />
    </div>
  );
}
