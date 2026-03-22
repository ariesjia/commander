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
import type { StudentItemsResponse } from "@/types/items";

async function fetchInventoryNamesForBattle(): Promise<string[]> {
  try {
    const body = await api.get<StudentItemsResponse>("/api/student/items");
    return [
      ...new Set(
        body.items
          .filter((r) => r.quantity > 0)
          .map((r) => r.item.name.trim())
          .filter(Boolean),
      ),
    ];
  } catch {
    return [];
  }
}

function itemRewardsFromReplay(
  rewards: TodayBattleReplay["rewards"] | undefined,
): { label: string; quantity: number; imageUrl?: string }[] {
  if (!rewards?.length) return [];
  const out: { label: string; quantity: number; imageUrl?: string }[] = [];
  for (const r of rewards) {
    if (r.kind !== "item" || !r.itemSlug) continue;
    const label = (r.name?.trim() || r.itemSlug) as string;
    const quantity = typeof r.quantity === "number" && r.quantity > 0 ? r.quantity : 1;
    const imageUrl = r.imageUrl?.trim() || undefined;
    out.push({ label, quantity, imageUrl });
  }
  return out;
}

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
  rewards: {
    kind: string;
    amount?: number;
    itemSlug?: string;
    quantity?: number;
    name?: string;
    imageUrl?: string;
  }[];
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
      skills: Array.isArray(r.enemy.skills) ? r.enemy.skills : [],
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
  /** 与本场演出同步的道具名（POST/回放前拉取，避免异步补全导致战报重启） */
  const [battleInventoryNames, setBattleInventoryNames] = useState<string[]>([]);
  const [battleBgmStopped, setBattleBgmStopped] = useState(false);
  const battleBgmRef = useRef<HTMLAudioElement | null>(null);
  const postBattleBgmStopTimerRef = useRef<number | null>(null);
  /** 本场演出是否来自「回放」按钮（结束时清空 battleResult 以便再次显示今日战果） */
  const presentationFromReplayRef = useRef(false);

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

  /** 预拉库存道具名：开战前就有列表，且与 POST 后再拉取形成双保险（战报装饰依赖非空名称） */
  useEffect(() => {
    void fetchInventoryNamesForBattle().then(setBattleInventoryNames);
  }, []);

  const handleBattlePresentationComplete = useCallback(() => {
    setReplayInProgress(false);
    if (presentationFromReplayRef.current) {
      presentationFromReplayRef.current = false;
      setBattleInventoryNames([]);
      setBattleResult(null);
    }
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
      presentationFromReplayRef.current = false;
      setReplayInProgress(true);
      const invNames = await fetchInventoryNamesForBattle();
      setBattleInventoryNames(invNames);
      setBattleMountKey((k) => k + 1);
      setBattleResult({
        outcome: data.outcome,
        narrative: data.narrative,
        enemy: {
          name: data.enemy.name,
          imageUrl: data.enemy.imageUrl,
          skills: Array.isArray(data.enemy.skills) ? data.enemy.skills : [],
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
    presentationFromReplayRef.current = true;
    setBattleBgmStopped(false);
    clearPostBattleBgmTimer();
    setPostError(null);
    setReplayInProgress(true);
    void fetchInventoryNamesForBattle().then((names) => {
      setBattleInventoryNames(names);
      setBattleMountKey((k) => k + 1);
      setBattleResult(mapReplayToServerPayload(r));
    });
  }, [status?.todayReplay, clearPostBattleBgmTimer]);

  const canStart =
    status?.canFight === true && !posting && battleResult === null && !status?.foughtToday;

  /** 仅「可开战」或本场已有结果时展示战斗台；已打过或积分不足进页时不占版面 */
  const showBattlePanel =
    battleResult !== null || status?.canFight === true;

  const spoilItems = status?.todayReplay
    ? itemRewardsFromReplay(status.todayReplay.rewards)
    : [];
  const spoilPoints = status?.todayReplay?.pointsAwarded ?? 0;

  /** 首屏拉取 /api/student/battle 完成前 status 为 null，避免整页空白 */
  const statusPending = status === null && statusError === null;

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

      {statusPending && (
        <div
          className="glass-card flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl p-8"
          aria-busy
          aria-live="polite"
        >
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
          <p className="text-sm text-s-text-secondary">加载战斗状态…</p>
        </div>
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

      {status?.foughtToday &&
        status.todayReplay &&
        battleResult === null &&
        !posting &&
        !replayInProgress && (
          <div className="glass-card rounded-xl p-4 text-sm space-y-2 border border-s-primary/15">
            <p className="font-display font-semibold text-s-text">今日战果</p>
            <div className="flex flex-wrap items-center gap-2 text-s-text">
              <span className="text-s-text-secondary">结果</span>
              <span
                className={
                  status.todayReplay.outcome === "WIN"
                    ? "font-bold text-emerald-400/95"
                    : "font-bold text-rose-400/95"
                }
              >
                {status.todayReplay.outcome === "WIN" ? "胜利" : "失败"}
              </span>
              <span className="text-s-text-secondary">·</span>
              <span className="text-s-text-secondary">对手</span>
              <span className="font-medium text-s-text">{status.todayReplay.enemy.name}</span>
            </div>
            {spoilPoints > 0 && (
              <p className="text-s-text">
                <span className="text-s-text-secondary">积分 </span>
                <span className="font-bold text-s-success">+{spoilPoints}</span>
              </p>
            )}
            {spoilItems.length > 0 && (
              <ul className="space-y-2 text-s-text">
                <li className="text-s-text-secondary list-none">道具</li>
                {spoilItems.map((it, i) => (
                  <li
                    key={`${it.label}-${i}`}
                    className="flex list-none items-center gap-3 rounded-lg border border-fuchsia-500/20 bg-black/25 py-2 pl-2 pr-3"
                  >
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-md border border-fuchsia-500/25 bg-black/40 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 font-medium text-fuchsia-300/95">
                      {it.label}
                      {it.quantity > 1 ? ` ×${it.quantity}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {spoilPoints <= 0 && spoilItems.length === 0 && (
              <p className="text-s-text-secondary text-xs">本场无积分与道具收益。</p>
            )}
          </div>
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
          playerInventoryNames={battleInventoryNames}
          externalFlow
          onBattlePresentationComplete={handleBattlePresentationComplete}
          onExit={() => {
            clearPostBattleBgmTimer();
            setBattleBgmStopped(false);
            setBattleInventoryNames([]);
            setBattleResult(null);
            router.back();
          }}
        />
      )}
    </div>
  );
}
