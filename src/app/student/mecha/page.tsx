"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { MechaLibraryPage } from "@/components/mecha/MechaLibraryPage";

export default function StudentMechaLibraryPage() {
  const { adoptedMechas, mechaPointsBySlug, showPinyin, isLoading, baseScore } = useData();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center gap-3 pb-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
        <p className="text-sm text-s-text-secondary">加载中...</p>
      </div>
    );
  }

  if (adoptedMechas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 pb-6">
        <p className="text-s-text-secondary">暂无机甲，快去领养吧</p>
        <button
          onClick={() => router.push("/student")}
          className="rounded-xl border border-s-primary/30 bg-s-primary/10 px-4 py-2 text-sm text-s-primary"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => router.back()}
          className="absolute left-0 rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10 transition-colors"
          aria-label="返回"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-semibold text-s-text">机甲库</h1>
      </div>

      <MechaLibraryPage
        adoptedMechas={adoptedMechas}
        mechaPointsBySlug={mechaPointsBySlug}
        showPinyin={showPinyin}
        baseScore={baseScore}
      />
    </div>
  );
}
