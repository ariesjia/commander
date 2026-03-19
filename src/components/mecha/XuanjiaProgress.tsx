"use client";

import { useMecha, getNextLevelProgress } from "@/hooks/useMecha";
import { toDisplay } from "@/lib/score-display";
import type { BaseScore } from "@/lib/score-display";

interface XuanjiaProgressProps {
  slug: string;
  mechaPoints: number;
  baseScore?: BaseScore;
}

export function XuanjiaProgress({ slug, mechaPoints, baseScore = 1 }: XuanjiaProgressProps) {
  const { data: mecha } = useMecha(slug);
  const progress = getNextLevelProgress(mecha, mechaPoints);

  if (!progress) {
    return null;
  }

  const { current, next, progress: progressPct } = progress;
  const maxLevel = mecha?.levels?.length ? mecha.levels.length - 1 : 7;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-s-text-secondary">升级进度</span>
        <span className="text-xs font-medium text-s-primary">
          级别 {current.level} / {maxLevel}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {mecha?.levels.map((l) => (
          <div
            key={l.level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              l.level <= current.level
                ? "bg-s-primary shadow-[0_0_6px_rgba(0,212,255,0.5)]"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-s-text">{current.name}</span>
        {next && (
          <span className="text-s-text-secondary">
            → {next.name} ({toDisplay(next.threshold, baseScore)}分)
          </span>
        )}
        {!next && <span className="text-s-accent">完整体!</span>}
      </div>

      {next && (
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-s-primary to-s-accent transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
