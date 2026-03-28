"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { MechaLibraryPage } from "@/components/mecha/MechaLibraryPage";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";

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
    <div className="flex flex-col gap-5 pb-6">
      <StudentPageHeader title="机甲库" />

      <MechaLibraryPage
        adoptedMechas={adoptedMechas}
        mechaPointsBySlug={mechaPointsBySlug}
        showPinyin={showPinyin}
        baseScore={baseScore}
      />
    </div>
  );
}
