"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useData } from "@/contexts/DataContext";
import { Bot, X } from "lucide-react";
import { toDisplay } from "@/lib/score-display";

interface MechaLevel {
  level: number;
  name: string;
  threshold: number;
  imageUrl: string;
  description: string;
}

interface ParentMechaItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  intro: string | null;
  levels: MechaLevel[];
  ownedCount: number;
  points: number;
}

function getCurrentLevel(levels: MechaLevel[], points: number): MechaLevel | null {
  if (!levels.length) return null;
  let current = levels[0]!;
  for (const l of levels) {
    if (points >= l.threshold) current = l;
    else break;
  }
  return current;
}

function MechaDetailModal({
  mecha,
  baseScore,
  onClose,
}: {
  mecha: ParentMechaItem;
  baseScore: import("@/lib/score-display").BaseScore;
  onClose: () => void;
}) {
  const currentLevel = getCurrentLevel(mecha.levels, mecha.points);
  const currentIdx = mecha.levels.findIndex((l) => l === currentLevel);
  const currentLevelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = currentLevelRef.current;
    if (el) {
      const t = setTimeout(() => {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [mecha.slug]);

  const nextLevel = currentIdx >= 0 && currentIdx < mecha.levels.length - 1
    ? mecha.levels[currentIdx + 1]!
    : null;
  const progress = nextLevel
    ? Math.min(100, Math.round(((mecha.points - (currentLevel?.threshold ?? 0)) / (nextLevel.threshold - (currentLevel?.threshold ?? 0))) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-x-hidden" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md md:max-w-4xl min-w-0 overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-p-border p-4">
          <h2 className="min-w-0 truncate text-lg font-semibold text-p-text">{mecha.name}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-p-text-secondary hover:bg-p-bg hover:text-p-text"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] min-w-0 overflow-y-auto overflow-x-hidden p-4 md:overflow-hidden md:flex md:flex-col">
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6 md:flex-1 md:min-h-0">
            {/* 左侧：介绍、积分、当前等级 */}
            <div className="min-w-0 flex-1">
              {/* 机甲介绍 */}
              {mecha.intro && (
                <div className="mb-4 rounded-xl border border-p-border bg-p-bg/50 p-4">
                  <p className="text-sm text-p-text leading-relaxed">
                    {mecha.intro}
                  </p>
                </div>
              )}

              {/* 拥有与积分 */}
              <div className="mb-4 flex gap-4 rounded-xl bg-p-bg p-4">
                <div>
                  <p className="text-xs text-p-text-secondary">孩子拥有</p>
                  <p className="text-lg font-semibold text-p-text">{mecha.ownedCount} 个</p>
                </div>
                <div>
                  <p className="text-xs text-p-text-secondary">机甲积分</p>
                  <p className="text-lg font-semibold text-p-text">{mecha.points}</p>
                </div>
              </div>

              {/* 当前等级与进度 */}
              {currentLevel && (
                <div>
                  <p className="mb-2 text-sm font-medium text-p-text">当前等级</p>
                  <div className="flex min-w-0 items-center gap-4 rounded-xl border border-p-border p-4">
                    <img
                      src={currentLevel.imageUrl}
                      alt={currentLevel.name}
                      className="h-28 w-20 shrink-0 object-contain md:h-36 md:w-28"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-p-text">{currentLevel.name}</p>
                      <p className="break-words text-xs text-p-text-secondary">{currentLevel.description}</p>
                    </div>
                  </div>
                  {nextLevel && (
                    <div className="mt-2 md:hidden">
                      <div className="flex justify-between text-xs text-p-text-secondary">
                        <span>距下一级 {nextLevel.name}</span>
                        <span>{mecha.points} / {nextLevel.threshold}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-p-border">
                        <div
                          className="h-full rounded-full bg-p-accent transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 右侧：等级一览（PC 时与左侧同高，列表独立滚动） */}
            <div className="min-w-0 shrink-0 md:w-72 md:flex md:flex-col md:min-h-0">
              <p className="mb-2 text-sm font-medium text-p-text shrink-0">等级一览</p>
              <div className="min-h-0 md:flex-1 md:overflow-y-auto">
                <div className="space-y-2">
                {mecha.levels.map((l) => {
                  const isUnlocked = mecha.points >= l.threshold;
                  const isCurrent = l === currentLevel;
                  return (
                    <div
                      key={l.level}
                      ref={isCurrent ? currentLevelRef : undefined}
                      className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 ${
                        isUnlocked ? "border-p-border bg-p-card" : "border-p-border/50 bg-p-bg/50 opacity-70"
                      }`}
                    >
                      <img
                        src={l.imageUrl}
                        alt={l.name}
                        className="h-14 w-10 object-contain shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-p-text">{l.name}</p>
                        <p className="break-words text-xs text-p-text-secondary">
                          {toDisplay(l.threshold, baseScore)} 积分 · {l.description}
                        </p>
                      </div>
                      {isUnlocked && (
                        <span className="shrink-0 rounded bg-p-success/10 px-2 py-0.5 text-xs text-p-success">
                          已解锁
                        </span>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MechaCard({
  mecha,
  onSelect,
}: {
  mecha: ParentMechaItem;
  onSelect: () => void;
}) {
  const level0 = mecha.levels[0];
  const currentLevel = getCurrentLevel(mecha.levels, mecha.points);

  return (
    <button
      onClick={onSelect}
      className="flex flex-col rounded-xl border border-p-border bg-p-card p-4 text-left transition-shadow hover:shadow-md cursor-pointer"
    >
      <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-p-bg">
        {level0 ? (
          <img
            src={currentLevel?.imageUrl ?? level0.imageUrl}
            alt={mecha.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <Bot size={32} className="text-p-text-secondary" />
        )}
      </div>
      <h3 className="mt-3 font-semibold text-p-text">{mecha.name}</h3>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-p-text-secondary">
        <span>拥有 {mecha.ownedCount} 个</span>
        <span>积分 {mecha.points}</span>
      </div>
    </button>
  );
}

export default function ParentMechaPage() {
  const { baseScore } = useData();
  const [mechas, setMechas] = useState<ParentMechaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ParentMechaItem | null>(null);

  useEffect(() => {
    api
      .get<ParentMechaItem[]>("/api/parent/mechas")
      .then(setMechas)
      .catch(() => setMechas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-p-accent border-t-transparent" />
        <p className="text-sm text-p-text-secondary">加载中...</p>
      </div>
    );
  }

  if (mechas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-p-bg">
          <Bot size={40} className="text-p-text-secondary" />
        </div>
        <p className="text-center text-p-text-secondary">暂无机甲配置</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div>
        <h1 className="text-xl font-semibold text-p-text">机甲图鉴</h1>
        <p className="mt-1 text-sm text-p-text-secondary">
          系统中所有机甲，孩子拥有数量及积分。建议参考升级积分来设置任务和奖励哦
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {mechas.map((mecha) => (
          <MechaCard
            key={mecha.slug}
            mecha={mecha}
            onSelect={() => setSelected(mecha)}
          />
        ))}
      </div>

      {selected && (
        <MechaDetailModal mecha={selected} baseScore={baseScore} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
