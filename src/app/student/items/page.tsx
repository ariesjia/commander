"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { ItemInventoryPage } from "@/components/items/ItemInventoryPage";

export default function StudentItemsPage() {
  const router = useRouter();
  const { showPinyin } = useData();

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0 rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10 transition-colors touch-manipulation"
          aria-label="返回"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-semibold text-s-text">道具库</h1>
      </div>

      <ItemInventoryPage showPinyin={showPinyin} />
    </div>
  );
}
