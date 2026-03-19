"use client";

import { getNextStageProgress, MECHA_STAGES } from "@/lib/mecha-config";
import { toDisplay } from "@/lib/score-display";
import type { BaseScore } from "@/lib/score-display";

interface MechaProgressProps {
  totalPoints: number;
  stage: number;
  baseScore?: BaseScore;
}

export function MechaProgress({ totalPoints, stage, baseScore = 1 }: MechaProgressProps) {
  const { current, next, progress } = getNextStageProgress(totalPoints);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-s-text-secondary">组装进度</span>
        <span className="text-xs font-medium text-s-primary">
          阶段 {stage}/7
        </span>
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-1 mb-3">
        {MECHA_STAGES.map((s) => (
          <div
            key={s.stage}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              s.stage <= stage
                ? "bg-s-primary shadow-[0_0_6px_rgba(0,212,255,0.5)]"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Current → Next */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-s-text">{current.name}</span>
        {next && (
          <span className="text-s-text-secondary">
            → {next.name} ({toDisplay(next.threshold, baseScore)}分)
          </span>
        )}
        {!next && <span className="text-s-accent">组装完成!</span>}
      </div>

      {/* Progress bar to next stage */}
      {next && (
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-s-primary to-s-accent transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
