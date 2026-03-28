"use client";

import { Flame, Sparkles } from "lucide-react";
import { getStreakDisplay, STREAK_EFFECTS } from "@/lib/mecha-config";
import { cn } from "@/lib/utils";

type Props = {
  streakDays: number;
  className?: string;
};

/**
 * 学生任务页连续打卡展示：大卡 + 天数 + 档位文案 + 下一档进度（由完成任务积累）。
 */
export function StudentStreakHero({ streakDays, className }: Props) {
  const { currentTier, nextTier, progressToNext } = getStreakDisplay(streakDays);
  const isMax = !nextTier;
  const nextLabel = nextTier?.name ?? STREAK_EFFECTS[STREAK_EFFECTS.length - 1].name;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/[0.18] via-orange-600/[0.12] to-rose-900/20 px-4 py-4 shadow-[0_0_40px_rgba(245,158,11,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
      aria-label="连续打卡天数"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-4 h-24 w-24 rounded-full bg-orange-500/15 blur-2xl"
        aria-hidden
      />

      <div className="relative flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-600/25 shadow-[0_0_20px_rgba(251,146,60,0.35)] ring-1 ring-amber-300/30">
          <Flame className="h-7 w-7 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display text-4xl font-bold tabular-nums leading-none tracking-tight text-amber-50">
              {streakDays}
            </span>
            <span className="text-sm font-medium text-amber-200/85">天连续打卡</span>
          </div>

          {currentTier ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-left">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200/90 ring-1 ring-amber-400/25">
                <Sparkles className="h-3 w-3" strokeWidth={2} />
                {currentTier.name}
              </span>
              <span className="text-xs leading-snug text-amber-100/75">{currentTier.description}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-left text-xs leading-snug text-amber-100/80">
              每天做完任务，连续打卡满 {STREAK_EFFECTS[0].days} 天，就能当上「{STREAK_EFFECTS[0].name}」
            </p>
          )}

          {!isMax && nextTier && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between gap-2 text-[11px] font-medium text-amber-200/70">
                <span>再升一级</span>
                <span className="text-right text-amber-100/85">
                  {nextLabel} · 还差 {Math.max(0, nextTier.days - streakDays)} 天
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/30 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-[width] duration-500 ease-out shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}

          {isMax && currentTier && (
            <p className="mt-2 text-left text-[11px] text-amber-200/65">
              已经是最高一级啦
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
