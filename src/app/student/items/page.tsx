"use client";

import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

/** 道具库：占位页，后续接入真实数据与交互 */
export default function StudentItemsPage() {
  const router = useRouter();

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

      <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300/90">
          <Package size={32} strokeWidth={1.5} />
        </div>
        <div className="space-y-1.5">
          <p className="font-display text-base font-semibold text-s-text">整理背包中</p>
          <p className="text-sm leading-relaxed text-s-text-secondary max-w-sm mx-auto">
            道具与材料将在这里集中展示，方便你查看与使用。功能即将上线。
          </p>
        </div>
      </div>
    </div>
  );
}
