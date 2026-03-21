"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { MechaBattle, type ServerBattlePayload } from "@/components/battle/MechaBattle";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";
import { api } from "@/lib/api";
import { registerBattleBgmEl } from "@/lib/battle-bgm-bridge";
import type { BattleStatus, TodayBattleReplay } from "@/types";

type BattlePostResponse = {
  outcome: "WIN" | "LOSE";
  narrative: string;
  enemy: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    skills: string[];
  };
  rewards: { kind: string; amount?: number; itemSlug?: string; quantity?: number }[];
  pointsAwarded: number;
};

const BATTLE_BGM_SRC = "/sounds/battle.mp3";

function mapReplayToServerPayload(r: TodayBattleReplay): ServerBattlePayload {
  return {
    outcome: r.outcome,
    narrative: r.narrative,
    enemy: {
      name: r.enemy.name,
      imageUrl: r.enemy.imageUrl,
      skills: r.enemy.skills,
    },
    pointsAwarded: r.pointsAwarded > 0 ? r.pointsAwarded : undefined,
    rewards: r.rewards?.length ? r.rewards : undefined,
  };
}

export default function StudentBattlePage() {
  const router = useRouter();
  const { adoptedMechaIds, mechaPointsBySlug, refetch } = useData();
  const primarySlug = adoptedMechaIds[0] ?? null;
  const pts = primarySlug ? (mechaPointsBySlug[primarySlug] ?? 0) : 0;
  const { data: mecha } = useMecha(primarySlug);
  const level = getLevelFromMecha(mecha, pts);
  const playerMechaName = mecha
    ? `${mecha.name}·${level?.name ?? ""}`.replace(/·$/, "")
    : "训练用机体";

  const [status, setStatus] = useState<BattleStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [battleResult, setBattleResult] = useState<ServerBattlePayload | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [replayInProgress, setReplayInProgress] = useState(false);
  const [battleMountKey, setBattleMountKey] = useState(0);
  const [battleBgmStopped, setBattleBgmStopped] = useState(false);
  const battleBgmRef = useRef<HTMLAudioElement | null>(null);
  const postBattleBgmStopTimerRef = useRef<number | null>(null);

  const clearPostBattleBgmTimer = useCallback(() => {
    if (postBattleBgmStopTimerRef.current != null) {
      clearTimeout(postBattleBgmStopTimerRef.current);
      postBattleBgmStopTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPostBattleBgmTimer();
      registerBattleBgmEl(null);
      const a = battleBgmRef.current;
      if (a) {
        a.pause();
        a.currentTime = 0;
        battleBgmRef.current = null;
      }
    };
  }, [clearPostBattleBgmTimer]);

  useEffect(() => {
    if (battleResult === null) {
      clearPostBattleBgmTimer();
      setBattleBgmStopped(false);
    }
  }, [battleResult, clearPostBattleBgmTimer]);

  /** 点击开始战斗后（加载中 + 整场演出）循环播放 BGM；演出结束后再播约 5 秒即停 */
  useEffect(() => {
    const active = (posting || battleResult !== null) && !battleBgmStopped;
    if (!active) {
      const a = battleBgmRef.current;
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
      return;
    }

    let audio = battleBgmRef.current;
    if (!audio) {
      try {
        audio = new Audio(BATTLE_BGM_SRC);
      } catch {
        return;
      }
      audio.loop = true;
      audio.addEventListener("ended", function onEnded() {
        if (!audio!.loop) return;
        audio!.currentTime = 0;
        void audio!.play().catch(() => {});
      });
      battleBgmRef.current = audio;
    }
    registerBattleBgmEl(audio);
    void audio.play().catch(() => {});
  }, [posting, battleResult, battleBgmStopped]);

  const loadStatus = useCallback(async () => {
    try {
      const s = await api.get<BattleStatus>("/api/student/battle");
      setStatus(s);
      setStatusError(null);
    } catch (e) {
      setStatus(null);
      setStatusError(e instanceof Error ? e.message : "加载战斗状态失败");
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleBattlePresentationComplete = useCallback(() => {
    setReplayInProgress(false);
    clearPostBattleBgmTimer();
    postBattleBgmStopTimerRef.current = window.setTimeout(() => {
      postBattleBgmStopTimerRef.current = null;
      const a = battleBgmRef.current;
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
      setBattleBgmStopped(true);
    }, 5000);
  }, [clearPostBattleBgmTimer]);

  const startBattle = async () => {
    setBattleBgmStopped(false);
    clearPostBattleBgmTimer();
    setPostError(null);
    setPosting(true);
    try {
      const data = await api.post<BattlePostResponse>("/api/student/battle");
      const points =
        typeof data.pointsAwarded === "number" && data.pointsAwarded > 0
          ? data.pointsAwarded
          : undefined;
      setReplayInProgress(true);
      setBattleMountKey((k) => k + 1);
      setBattleResult({
        outcome: data.outcome,
        narrative: data.narrative,
        enemy: {
          name: data.enemy.name,
          imageUrl: data.enemy.imageUrl,
          skills: data.enemy.skills,
        },
        pointsAwarded: points,
        rewards: data.rewards?.length ? data.rewards : undefined,
      });
      setPosting(false);
      void refetch();
      void loadStatus();
    } catch (e) {
      setPostError(e instanceof Error ? e.message : "战斗请求失败");
      setPosting(false);
      setReplayInProgress(false);
    }
  };

  const startReplay = useCallback(() => {
    const r = status?.todayReplay;
    if (!r) return;
    setBattleBgmStopped(false);
    clearPostBattleBgmTimer();
    setPostError(null);
    setReplayInProgress(true);
    setBattleMountKey((k) => k + 1);
    setBattleResult(mapReplayToServerPayload(r));
  }, [status?.todayReplay, clearPostBattleBgmTimer]);

  const canStart =
    status?.canFight === true && !posting && battleResult === null && !status?.foughtToday;

  /** 仅「可开战」或本场已有结果时展示战斗台；已打过或积分不足进页时不占版面 */
  const showBattlePanel =
    battleResult !== null || status?.canFight === true;

  return (
    <div className="flex flex-col gap-3 pt-2 pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-s-text-secondary transition-colors hover:bg-white/10 hover:text-s-text touch-manipulation"
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-xl font-bold text-s-text md:text-2xl">每日战斗</h1>
      </div>

      {statusError && (
        <p className="text-sm text-s-danger px-1">{statusError}</p>
      )}

      {status && (
        <div className="glass-card rounded-xl p-4 text-sm space-y-2">
          <p className="text-s-text">
            今日任务积分进度：{" "}
            <span className="font-bold text-s-primary">
              {status.taskPointsToday}/{status.minPointsRequired}
            </span>
          </p>
          {status.foughtToday && (
            <p className="text-s-text-secondary">今日已完成战斗。</p>
          )}
          {!status.foughtToday && status.reasonCode === "THRESHOLD_NOT_MET" && (
            <p className="text-s-text-secondary">{status.message}</p>
          )}
        </div>
      )}

      {status && !status.foughtToday && battleResult === null && (
        <button
          type="button"
          disabled={!canStart}
          onClick={startBattle}
          className="w-full rounded-xl border-2 border-s-primary bg-s-primary/15 py-3 min-h-[48px] text-base font-bold text-s-primary shadow-[0_0_16px_rgba(0,212,255,0.2)] disabled:opacity-45 disabled:cursor-not-allowed touch-manipulation active:scale-[0.99] transition-transform"
        >
          {posting ? "加载中…" : "开始战斗"}
        </button>
      )}

      {status?.foughtToday && status.todayReplay && (
        <button
          type="button"
          disabled={posting || replayInProgress}
          onClick={startReplay}
          className="w-full rounded-xl border-2 border-amber-500/45 bg-amber-500/10 py-3 min-h-[48px] text-base font-bold text-amber-100/95 shadow-[0_0_14px_rgba(245,158,11,0.15)] disabled:opacity-45 disabled:cursor-not-allowed touch-manipulation active:scale-[0.99] transition-transform"
        >
          {replayInProgress ? "播放中…" : battleResult ? "再看一遍" : "回放今日战斗"}
        </button>
      )}

      {postError && <p className="text-sm text-s-danger px-1">{postError}</p>}

      {showBattlePanel && posting && (
        <div
          className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-s-primary/35 bg-[#0a1628] py-14 shadow-[inset_0_0_40px_rgba(0,40,80,0.45)]"
          aria-busy
          aria-live="polite"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
          <p className="text-sm text-s-text-secondary">载入战场数据…</p>
        </div>
      )}

      {showBattlePanel && !posting && (
        <MechaBattle
          key={battleMountKey}
          playerMechaName={playerMechaName}
          playerSlug={primarySlug}
          playerMechaPoints={pts}
          serverBattle={battleResult}
          externalFlow
          onBattlePresentationComplete={handleBattlePresentationComplete}
          onExit={() => {
            clearPostBattleBgmTimer();
            setBattleBgmStopped(false);
            setBattleResult(null);
            router.back();
          }}
        />
      )}
    </div>
  );
}
