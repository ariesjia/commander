"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { MechaDetail, MechaLevel } from "@/lib/mecha-adoption";

const mechaCache = new Map<string, MechaDetail>();
const pendingRequests = new Map<string, Promise<MechaDetail>>();

function fetchMecha(slug: string): Promise<MechaDetail> {
  const cached = mechaCache.get(slug);
  if (cached) return Promise.resolve(cached);

  let pending = pendingRequests.get(slug);
  if (!pending) {
    pending = api.get<MechaDetail>(`/api/mechas/${slug}`).then((data) => {
      const normalized: MechaDetail = {
        ...data,
        skills: data.skills ?? [],
        evolutionVideoUrl: data.evolutionVideoUrl ?? null,
      };
      mechaCache.set(slug, normalized);
      pendingRequests.delete(slug);
      return normalized;
    });
    pendingRequests.set(slug, pending);
  }
  return pending;
}

export function useMecha(slug: string | null) {
  const [data, setData] = useState<MechaDetail | null>(slug ? mechaCache.get(slug) ?? null : null);
  const [loading, setLoading] = useState(!!slug && !mechaCache.has(slug ?? ""));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setLoading(false);
      return;
    }
    const cached = mechaCache.get(slug);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchMecha(slug)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [slug]);

  return { data, loading, error };
}

/** 根据积分从机甲配置中计算当前等级 */
export function getLevelFromMecha(mecha: MechaDetail | null, totalPoints: number): MechaLevel | null {
  if (!mecha?.levels?.length) return null;
  const levels = mecha.levels;
  let current = levels[0]!;
  for (const l of levels) {
    if (totalPoints >= l.threshold) current = l;
    else break;
  }
  return current;
}

/** 获取下一级进度 */
export function getNextLevelProgress(
  mecha: MechaDetail | null,
  totalPoints: number
): { current: MechaLevel; next: MechaLevel | null; progress: number } | null {
  if (!mecha?.levels?.length) return null;
  const levels = mecha.levels;
  let currentIdx = 0;
  for (let i = 0; i < levels.length; i++) {
    if (totalPoints >= levels[i]!.threshold) currentIdx = i;
    else break;
  }
  const current = levels[currentIdx]!;
  const next = currentIdx < levels.length - 1 ? levels[currentIdx + 1]! : null;

  if (!next) return { current, next: null, progress: 100 };

  const range = next.threshold - current.threshold;
  const earned = totalPoints - current.threshold;
  const progress = Math.min(100, Math.round((earned / range) * 100));

  return { current, next, progress };
}
