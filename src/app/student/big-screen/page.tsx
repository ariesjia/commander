"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  MonitorSmartphone,
  RefreshCw,
} from "lucide-react";

import { XuanjiaViewer } from "@/components/mecha/XuanjiaViewer";
import { MechaViewer } from "@/components/mecha/MechaViewer";
import { api } from "@/lib/api";
import type { BaseScore } from "@/lib/score-display";
import { toDisplay } from "@/lib/score-display";
import { cn } from "@/lib/utils";

type BigScreenPayload = {
  nickname: string;
  /** 可用积分，与学生首页「可用积分」一致 */
  balance: number;
  baseScore: BaseScore;
  todayNet: number;
  primarySlug: string | null;
  primaryMechaPoints: number;
  mechaStage: number;
  todayChina: string;
};

function formatSignedDb(dbNet: number, baseScore: BaseScore): string {
  const disp = toDisplay(dbNet, baseScore);
  if (disp === 0) return "0";
  const sign = disp > 0 ? "+" : "";
  return `${sign}${disp}`;
}

/** 按今日可用积分净变化给一句鼓励 */
function cheerTodayChange(todayNet: number): string {
  if (todayNet > 0) return "今天开张加分啦，超棒的！";
  if (todayNet < 0) return "有点小波折没关系，下次一定能行～";
  return "今天去完成几个任务，机甲为你加油！";
}

export default function StudentBigScreenPage() {
  const router = useRouter();
  const [data, setData] = useState<BigScreenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshSpin, setRefreshSpin] = useState(false);

  const load = useCallback(async () => {
    try {
      const payload = await api.get<BigScreenPayload>("/api/student/big-screen");
      setData(payload);
      setError(null);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      const status = err.status;
      if (status === 401) {
        router.replace("/login");
        return;
      }
      if (status === 403) {
        setError("请先切换到学生模式");
        setData(null);
        return;
      }
      setError(err.message ?? "加载失败");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshSpin(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 45_000);
    return () => window.clearInterval(id);
  }, [load]);

  const handleManualRefresh = () => {
    setRefreshSpin(true);
    void load();
  };

  return (
    <div className="relative flex min-h-[min(100dvh,100%)] flex-col lg:justify-center lg:pb-4">
      {/* 顶栏 */}
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3 lg:mb-6">
        <Link
          href="/student"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm font-medium text-s-text-secondary",
            "transition-colors hover:border-cyan-500/35 hover:bg-cyan-500/10 hover:text-cyan-100 touch-manipulation min-h-[44px]",
          )}
        >
          <ArrowLeft size={18} className="shrink-0" />
          返回机甲首页
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            className={cn(
              "inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-black/25 text-s-text-secondary",
              "hover:border-cyan-500/35 hover:bg-cyan-500/10 hover:text-cyan-100 touch-manipulation transition-colors",
            )}
            aria-label="刷新数据"
          >
            <RefreshCw size={18} className={refreshSpin ? "animate-spin" : ""} />
          </button>
          <span className="hidden text-xs text-s-text-secondary sm:inline-flex sm:items-center sm:gap-1">
            <MonitorSmartphone size={14} className="opacity-70" />
            约 45 秒刷新
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
          <p className="text-sm text-s-text-secondary">载入大屏数据中…</p>
        </div>
      )}

      {!loading && error && (
        <div className="glass-card flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center">
          <p className="text-s-danger">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="rounded-xl bg-s-primary/20 px-4 py-2 text-sm font-medium text-s-primary"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-12">
          {/* 左侧：得分 */}
          <section className="flex flex-[1_1_42%] flex-col justify-center gap-4 lg:gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-s-primary/60">可用积分</p>
              <p
                className="font-display font-bold tracking-tight text-s-text neon-text mt-2"
                style={{ fontSize: "clamp(2.25rem, 7vw + 1rem, 6rem)", lineHeight: 1.05 }}
              >
                {toDisplay(data.balance, data.baseScore)}
              </p>
            </div>

            {/* 今日变化 */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-4 sm:p-5">
              {data.todayNet > 0 ? (
                <TrendingUp className="mt-0.5 h-10 w-10 shrink-0 text-emerald-400" aria-hidden />
              ) : data.todayNet < 0 ? (
                <TrendingDown className="mt-0.5 h-10 w-10 shrink-0 text-rose-400" aria-hidden />
              ) : (
                <RotateCcw className="mt-0.5 h-10 w-10 shrink-0 text-s-text-secondary/70" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-s-text-secondary">今日可用积分变化</p>
                  <p className="font-display text-lg font-bold tabular-nums sm:text-xl">
                    {data.todayNet === 0 ? (
                      <span className="text-s-text-secondary">今天可用积分无变化</span>
                    ) : (
                      <span className={data.todayNet > 0 ? "text-emerald-300" : "text-rose-300"}>
                        {formatSignedDb(data.todayNet, data.baseScore)}
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-medium leading-snug text-cyan-200/88">
                    {cheerTodayChange(data.todayNet)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 右侧：机甲 */}
          <section className="relative flex flex-[1_1_58%] min-h-[40vh] flex-col items-center justify-center lg:min-h-[min(70vh,50rem)]">
            <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden rounded-3xl" aria-hidden>
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_50%_82%,rgba(34,211,238,0.1),transparent_58%)]" />
              <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative h-[min(92vw,28rem)] w-[min(112vw,38rem)] md:h-[min(40rem,85vh)] md:w-[min(48rem,92vw)]">
                  <div
                    className="animate-big-screen-mecha-glow-breathe absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.48)_0%,rgba(139,92,246,0.2)_42%,transparent_72%)] blur-[38px]"
                  />
                  <div
                    className="animate-big-screen-mecha-glow-breathe-soft absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.28)_0%,rgba(236,72,153,0.08)_45%,transparent_62%)] blur-[28px]"
                  />
                </div>
              </div>
            </div>
            <p className="mb-4 text-center font-display text-xs font-semibold uppercase tracking-[0.35em] text-s-primary/55">
              {data.nickname} · 当前机体
            </p>
            <div className="relative flex min-h-[min(52vh,28rem)] w-full flex-1 items-end justify-center overflow-hidden rounded-2xl px-2 lg:min-h-[min(64vh,40rem)]">
              <div
                className="pointer-events-none absolute inset-0 z-[3] overflow-hidden rounded-2xl"
                aria-hidden
              >
                <div
                  className="animate-big-screen-mecha-shine-sweep absolute left-0 top-[6%] h-[88%] w-[min(42vw,14rem)] bg-[linear-gradient(100deg,transparent_0%,transparent_36%,rgba(236,254,255,0.85)_49.5%,rgba(165,243,252,0.35)_50.5%,transparent_64%,transparent_100%)] mix-blend-soft-light"
                />
              </div>
              <div className="relative z-[1] flex w-full items-end justify-center">
                {data.primarySlug ? (
                  <XuanjiaViewer
                    slug={data.primarySlug}
                    mechaPoints={data.primaryMechaPoints}
                    className="max-h-[min(72vh,48rem)] w-full max-w-[min(92vw,36rem)]"
                  />
                ) : (
                  <MechaViewer
                    stage={data.mechaStage}
                    className="aspect-[2/3] h-[min(72vh,48rem)] w-auto max-w-full"
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
