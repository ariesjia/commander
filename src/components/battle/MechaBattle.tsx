"use client";

/* Battle UI syncs phase/HP/log from intervals and image URL changes; setState in effects is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";
import { setBattleBgmDucked } from "@/lib/battle-bgm-bridge";
import { SPEECH_SYNTHESIS_RATE } from "@/lib/speech-config";

import { BattleArenaFx } from "@/components/battle/BattleArenaFx";
import { buildServerBattleSteps } from "@/components/battle/battle-step-builder";
import {
  BATTLE_START_LINES,
  CLOSING_VOICE_LOSE,
  CLOSING_VOICE_WIN,
  COMBAT_ATMOSPHERE_LINES,
  randomPick,
} from "@/components/battle/battle-narrative";
import { useBattlePresentationFx } from "@/components/battle/useBattlePresentationFx";

function battleSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

type SpeakBattleLineOptions = {
  /** 页面卸载或离开战斗时 abort，避免 Promise 悬挂、BGM 一直压低 */
  signal?: AbortSignal;
};

/**
 * 朗读一行战报（仅 cancel 语音队列，不影响 BGM）。
 * 朗读时略压低 BGM，结束后恢复，便于与循环 BGM 同时听清。
 */
function speakBattleLine(text: string, opts?: SpeakBattleLineOptions): Promise<void> {
  if (!battleSpeechSupported()) return Promise.resolve();
  const signal = opts?.signal;
  if (signal?.aborted) return Promise.resolve();

  const synth = window.speechSynthesis;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(hangTimer);
      signal?.removeEventListener("abort", onAbort);
      setBattleBgmDucked(false);
      resolve();
    };

    const onAbort = () => {
      synth.cancel();
      finish();
    };
    signal?.addEventListener("abort", onAbort);

    /** 部分环境 TTS 既不 onend 也不 onerror，避免整段演出永久 await */
    const hangTimer = window.setTimeout(() => {
      synth.cancel();
      finish();
    }, 45_000);

    synth.cancel();
    setBattleBgmDucked(true);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = SPEECH_SYNTHESIS_RATE;
    const voices = synth.getVoices();
    const zh =
      voices.find((v) => v.lang === "zh-CN") ?? voices.find((v) => v.lang.startsWith("zh"));
    if (zh) u.voice = zh;
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  });
}


/** 与 POST /api/student/battle、todayReplay.rewards 对齐 */
export type ServerBattleRewardLine = {
  kind: string;
  amount?: number;
  itemSlug?: string;
  quantity?: number;
  name?: string;
  imageUrl?: string;
};

export type ServerBattlePayload = {
  outcome: "WIN" | "LOSE";
  narrative: string;
  enemy: { name: string; imageUrl: string; skills: string[] };
  pointsAwarded?: number;
  /** 胜利奖励明细（积分 + 道具等） */
  rewards?: ServerBattleRewardLine[];
};

function itemRewardLines(rewards: ServerBattleRewardLine[] | undefined) {
  if (!rewards?.length) return [];
  return rewards.filter(
    (r): r is ServerBattleRewardLine & { itemSlug: string } =>
      r.kind === "item" && typeof r.itemSlug === "string",
  );
}

type Phase = "ready" | "fighting" | "victory" | "defeat";

type Props = {
  playerMechaName: string;
  playerSlug: string | null;
  playerMechaPoints: number;
  onExit: () => void;
  /** 每日战斗：由页面 POST 成功后传入，演出结束于该结果，不再随机决胜 */
  serverBattle?: ServerBattlePayload | null;
  /** true 时不显示组件内「开始战斗」，由页面发起 POST */
  externalFlow?: boolean;
  /** 服务端演出全部结束（含收尾朗读）后触发，供页面做 BGM 收尾等 */
  onBattlePresentationComplete?: () => void;
  /** 学生库存道具名（仅战报装饰，不影响服务端战斗结果） */
  playerInventoryNames?: string[];
};

export function MechaBattle({
  playerMechaName,
  playerSlug,
  playerMechaPoints,
  onExit,
  serverBattle = null,
  externalFlow = false,
  onBattlePresentationComplete,
  playerInventoryNames = [],
}: Props) {
  const reduceMotionPreferred = useReducedMotion();
  /** 仅 true 视为减少动效；忽略 null→false，避免 triggerFx/战斗 effect 依赖抖动导致演出被 cancel、战报空白 */
  const reducedMotion = reduceMotionPreferred === true;
  const { data: playerMecha, loading: playerMechaLoading } = useMecha(playerSlug);
  const playerLevel = getLevelFromMecha(playerMecha, playerMechaPoints);
  const playerImageUrl =
    playerSlug && playerLevel?.imageUrl ? playerLevel.imageUrl : null;
  const [playerImgError, setPlayerImgError] = useState(false);
  const [enemyImgError, setEnemyImgError] = useState(false);

  useEffect(() => {
    setPlayerImgError(false);
  }, [playerImageUrl]);

  useEffect(() => {
    setEnemyImgError(false);
  }, [serverBattle?.enemy.imageUrl]);

  const [phase, setPhase] = useState<Phase>("ready");
  const [hp, setHp] = useState({ p: 100, e: 100, eMax: 100 });
  const [log, setLog] = useState<string[]>([]);
  const { playBattleFx, fx } = useBattlePresentationFx({
    reducedMotion,
    reduceMotionPreferred,
  });
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logScrollRef = useRef<HTMLDivElement | null>(null);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (serverBattle != null) return;
    clearTick();
    if (externalFlow) {
      setPhase("ready");
      setLog([]);
      setHp({ p: 100, e: 100, eMax: 100 });
    }
  }, [serverBattle, externalFlow, clearTick]);

  useEffect(() => {
    if (typeof window === "undefined" || !battleSpeechSupported()) return;
    if (window.speechSynthesis.getVoices().length > 0) return;
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = onVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    const el = logScrollRef.current;
    if (!el || log.length === 0) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [log]);

  /** 服务端裁决模式：逐条战报；支持朗读时读完一行再进入下一回合 */
  useEffect(() => {
    if (!serverBattle || externalFlow === false) return;

    clearTick();
    let cancelled = false;
    const speechAbort = new AbortController();
    const useSpeech = battleSpeechSupported();
    const paceMs = reducedMotion ? 520 : 880;
    /** 朗读：一句念完再留白（句间 1 秒） */
    const pauseAfterSpokenLineMs = 1000;

    const afterLine = async (line: string) => {
      if (cancelled) return;
      if (useSpeech) {
        await speakBattleLine(line, { signal: speechAbort.signal });
        if (cancelled) return;
        await new Promise<void>((r) => window.setTimeout(r, pauseAfterSpokenLineMs));
      } else {
        await new Promise<void>((r) => window.setTimeout(r, paceMs));
      }
    };

    const run = async () => {
      setPhase("fighting");
      setHp({ p: 100, e: 100, eMax: 100 });
      setLog([]);

      const skillLine =
        serverBattle.enemy.skills.length > 0
          ? `敌人会用的招：${serverBattle.enemy.skills.join("、")}`
          : "";
      const openLines = [
        `—— 遇到敌人：${serverBattle.enemy.name} ——`,
        ...(skillLine ? [skillLine] : []),
        randomPick(COMBAT_ATMOSPHERE_LINES),
        randomPick(BATTLE_START_LINES),
      ];

      for (const line of openLines) {
        if (cancelled) return;
        setLog((prev) => [...prev, line]);
        await afterLine(line);
      }

      const steps = buildServerBattleSteps({
        outcome: serverBattle.outcome,
        enemySkills: serverBattle.enemy.skills,
        inventoryNames: playerInventoryNames,
      });

      for (const s of steps) {
        if (cancelled) return;
        setHp({ p: s.p, e: s.e, eMax: 100 });
        setLog((prev) => [...prev.slice(-12), s.line]);
        playBattleFx(s.fx);
        await afterLine(s.line);
      }

      if (cancelled) return;
      await new Promise<void>((r) => window.setTimeout(r, reducedMotion ? 200 : 420));
      if (cancelled) return;

      setPhase(serverBattle.outcome === "WIN" ? "victory" : "defeat");

      if (useSpeech) {
        await speakBattleLine(serverBattle.narrative, { signal: speechAbort.signal });
        if (cancelled) return;
        await new Promise<void>((r) => window.setTimeout(r, pauseAfterSpokenLineMs));
        if (
          serverBattle.outcome === "WIN" &&
          serverBattle.pointsAwarded != null &&
          serverBattle.pointsAwarded > 0
        ) {
          if (cancelled) return;
          await speakBattleLine(`获得积分 ${serverBattle.pointsAwarded} 分`, {
            signal: speechAbort.signal,
          });
          if (cancelled) return;
          await new Promise<void>((r) => window.setTimeout(r, pauseAfterSpokenLineMs));
        }
        if (serverBattle.outcome === "WIN") {
          for (const it of itemRewardLines(serverBattle.rewards)) {
            if (cancelled) return;
            const label = it.name?.trim() || it.itemSlug;
            const q = typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1;
            await speakBattleLine(
              q > 1 ? `获得道具 ${label}，共 ${q} 件` : `获得道具 ${label}`,
              { signal: speechAbort.signal },
            );
            if (cancelled) return;
            await new Promise<void>((r) => window.setTimeout(r, pauseAfterSpokenLineMs));
          }
        }
        if (cancelled) return;
        await speakBattleLine(
          serverBattle.outcome === "WIN"
            ? randomPick(CLOSING_VOICE_WIN)
            : randomPick(CLOSING_VOICE_LOSE),
          { signal: speechAbort.signal },
        );
      }
      if (!cancelled) onBattlePresentationComplete?.();
    };

    void run();

    return () => {
      cancelled = true;
      speechAbort.abort();
      clearTick();
      if (typeof window !== "undefined" && battleSpeechSupported()) {
        window.speechSynthesis.cancel();
      }
      setBattleBgmDucked(false);
    };
  }, [
    serverBattle,
    externalFlow,
    reducedMotion,
    playBattleFx,
    clearTick,
    onBattlePresentationComplete,
    playerInventoryNames,
  ]);

  const fightingOrEnd = phase === "fighting" || phase === "victory" || phase === "defeat";
  const showEnemy = externalFlow ? Boolean(serverBattle) : false;

  const enemyName = serverBattle?.enemy.name ?? "";
  const enemyImageUrl = serverBattle?.enemy.imageUrl ?? null;

  const arenaPad = externalFlow ? "pb-3 pt-5" : "pb-5 pt-10";
  const imgMax =
    externalFlow
      ? "max-h-[min(150px,26svh)] max-w-[min(100%,148px)]"
      : "max-h-[min(200px,34vh)] max-w-[min(100%,168px)]";

  return (
    <div
      className={`flex flex-col rounded-xl border-2 border-s-primary/40 bg-[#0a1628] shadow-[inset_0_0_60px_rgba(0,40,80,0.5)] overflow-hidden font-mono text-sm ${
        externalFlow ? "min-h-0" : "min-h-[min(100dvh,720px)]"
      }`}
    >
      <div
        className={`relative border-b-2 border-s-primary/30 ${
          externalFlow
            ? "h-[clamp(196px,30svh,268px)] shrink-0"
            : "min-h-[46vh] flex-1"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgba(0,8,20,0.55)_100%)]"
          aria-hidden
        />
        {!reduceMotionPreferred && (
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.08) 2px, rgba(0,212,255,0.08) 4px)",
            }}
          />
        )}
        <BattleArenaFx reduceMotionPreferred={reduceMotionPreferred} fx={fx} />
        <div className="absolute inset-0 z-[2] overflow-hidden">
          <div
            className="absolute bottom-0 left-1/2 h-[52%] w-[220%] origin-bottom -translate-x-1/2"
            style={{
              transform: "translateX(-50%) perspective(140px) rotateX(60deg)",
              background:
                "linear-gradient(180deg, rgba(0,60,90,0.25) 0%, rgba(0,20,40,0.92) 100%), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,212,255,0.1) 20px, rgba(0,212,255,0.1) 21px)",
            }}
          />
        </div>

        <p className="pointer-events-none absolute left-1/2 top-2 z-[18] -translate-x-1/2 text-[10px] font-bold tracking-[0.35em] text-cyan-400/55">
          COMBAT ZONE
        </p>

        <div className="relative z-[5] flex h-full min-h-0 flex-row">
          <div
            className={`relative flex min-w-0 flex-1 flex-col items-center justify-end border-r border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 via-[#0a1628]/80 to-transparent ${arenaPad} ${
              fx.shake === "player" ? "animate-battle-shake" : ""
            } ${!reduceMotionPreferred && fightingOrEnd && phase === "fighting" ? "animate-battle-threat-pulse" : ""}`}
          >
            <p className="mb-2 rounded bg-cyan-950/70 px-2 py-0.5 text-[10px] font-bold tracking-widest text-cyan-200/90 ring-1 ring-cyan-400/35">
              ALLY
            </p>
            <div
              className={`${
                fx.dodgeDance === "player"
                  ? fx.dodgeMotionClassName
                  : !reduceMotionPreferred && phase === "fighting" && fx.shake === "none"
                    ? "animate-battle-idle"
                    : ""
              }`}
            >
              {playerSlug && playerMechaLoading && !playerLevel ? (
                <div className="flex h-36 max-w-[9rem] flex-col items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-black/30 px-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/40 border-t-cyan-300" />
                  <span className="text-center text-[10px] text-cyan-200/70">同步机体…</span>
                </div>
              ) : playerImageUrl && !playerImgError ? (
                <div
                  className={`flex justify-center transition-transform duration-200 ${
                    fx.shake === "player" ? "scale-95 brightness-125" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 等级立绘 URL */}
                  <img
                    src={playerImageUrl}
                    alt={playerMechaName}
                    className={`${imgMax} w-auto object-contain object-bottom drop-shadow-[0_10px_28px_rgba(34,211,238,0.28)]`}
                    onError={() => setPlayerImgError(true)}
                  />
                </div>
              ) : (
                <PlayerSilhouette hit={fx.shake === "player"} />
              )}
            </div>
            <p className="mt-3 max-w-[95%] truncate px-1 text-center text-[11px] font-bold tracking-wide text-cyan-100/90">
              {playerMechaName}
            </p>
          </div>

          <div
            className={`relative flex min-w-0 flex-1 flex-col items-center justify-end bg-gradient-to-bl from-amber-950/25 via-[#0a1628]/80 to-transparent ${arenaPad} ${
              fx.shake === "enemy" ? "animate-battle-shake" : ""
            } ${!reduceMotionPreferred && fightingOrEnd && phase === "fighting" && showEnemy ? "animate-battle-threat-pulse-enemy" : ""}`}
          >
            {showEnemy ? (
              <>
                <p className="mb-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-200/95 ring-1 ring-amber-500/45">
                  TARGET
                </p>
                <div
                  className={`${
                    fx.dodgeDance === "enemy"
                      ? fx.dodgeMotionClassName
                      : !reduceMotionPreferred && phase === "fighting" && fx.shake === "none"
                        ? "animate-battle-idle"
                        : ""
                  }`}
                  style={{ animationDelay: fx.dodgeDance === "enemy" ? undefined : "0.4s" }}
                >
                  {enemyImageUrl && !enemyImgError ? (
                    <div
                      className={`flex justify-center transition-transform duration-200 ${
                        fx.shake === "enemy" ? "scale-95 brightness-125" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={enemyImageUrl}
                        alt={enemyName}
                        className={`${imgMax} w-auto object-contain object-bottom drop-shadow-[0_10px_28px_rgba(251,146,60,0.25)]`}
                        onError={() => setEnemyImgError(true)}
                      />
                    </div>
                  ) : (
                    <EnemySilhouette
                      type="unknown"
                      color="#4a3d5c"
                      hit={fx.shake === "enemy"}
                      faceToward="left"
                    />
                  )}
                </div>
                <p className="mt-3 max-w-[95%] truncate px-1 text-center text-[11px] font-bold tracking-widest text-amber-100/85">
                  {enemyName}
                </p>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-8 text-center">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-s-primary/25 bg-s-primary/5" />
                <p className="text-[10px] tracking-widest text-s-text-secondary/80">NO LOCK</p>
                <p className="max-w-[9rem] text-[10px] leading-relaxed text-s-text-secondary/60">
                  {externalFlow ? "发起战斗后将显示对手" : "开始战斗后随机遭遇敌机"}
                </p>
              </div>
            )}
          </div>
        </div>

        {phase === "ready" && (
          <div className="absolute inset-0 z-[22] flex flex-col items-center justify-center gap-2 bg-[#050d18]/88 px-4 text-center backdrop-blur-[2px]">
            <p className="neon-text text-xs tracking-[0.35em] text-s-primary">
              {externalFlow ? "DAILY BATTLE" : "SIMULATION"}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 bg-[#061018] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
          <div>
            <div className="mb-0.5 flex justify-between text-s-text-secondary">
              <span>{playerMechaName}</span>
              <span>{hp.p}/100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-sm border border-s-primary/40 bg-black/60">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-s-primary transition-[width] duration-300"
                style={{ width: `${hp.p}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-0.5 flex justify-between text-s-text-secondary">
              <span>敌方</span>
              <span>{showEnemy ? `${hp.e}/${hp.eMax}` : "--"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-sm border border-amber-600/50 bg-black/60">
              <div
                className="h-full bg-gradient-to-r from-amber-800 to-amber-500 transition-[width] duration-300"
                style={{ width: showEnemy ? `${(hp.e / hp.eMax) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>

        <div
          ref={logScrollRef}
          className="h-28 overflow-y-auto scroll-smooth rounded border border-s-primary/20 bg-black/40 px-2 py-1.5 text-[11px] leading-relaxed text-s-text/90"
        >
          {log.length === 0 ? (
            <span className="text-s-text-secondary/70">等待战斗数据…</span>
          ) : (
            log.map((line, i) => (
              <div key={`battle-log-${i}`} className="border-b border-white/5 py-0.5 last:border-0">
                {line}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(phase === "victory" || phase === "defeat") && serverBattle && (
            <>
              <p className="w-full text-center text-[11px] leading-relaxed text-s-text/90 px-1">
                {serverBattle.narrative}
              </p>
              {phase === "victory" && serverBattle.pointsAwarded != null && serverBattle.pointsAwarded > 0 && (
                <p className="w-full text-center text-xs font-bold text-s-success">
                  获得积分 +{serverBattle.pointsAwarded}
                </p>
              )}
              {phase === "victory" &&
                itemRewardLines(serverBattle.rewards).map((it, i) => {
                  const label = it.name?.trim() || it.itemSlug;
                  const q = typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1;
                  const src = it.imageUrl?.trim();
                  return (
                    <div
                      key={`item-reward-${i}-${it.itemSlug}`}
                      className="flex w-full items-center justify-center gap-2 px-1"
                    >
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-fuchsia-500/30 bg-black/30 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                      <p className="min-w-0 flex-1 text-center text-xs font-bold text-fuchsia-300/95">
                        获得道具 {label}
                        {q > 1 ? ` ×${q}` : ""}
                      </p>
                    </div>
                  );
                })}
            </>
          )}
        </div>

        {(phase === "victory" || phase === "defeat") && (
          <p
            className={`text-center text-sm font-bold tracking-widest ${
              phase === "victory" ? "text-s-success" : "text-s-danger"
            }`}
          >
            {phase === "victory" ? "任务完成 · 敌机击坠" : "警告 · 机体大破"}
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerSilhouette({ hit }: { hit: boolean }) {
  const body = "#1e5a8a";
  const trim = "#38bdf8";
  const base = `flex flex-col items-center transition-transform duration-200 ${hit ? "scale-95 brightness-125" : "scale-100"}`;
  return (
    <div className={base}>
      <div className="mb-1 flex gap-2">
        <div className="relative h-7 w-6 rounded-sm border border-black/20" style={{ backgroundColor: body }}>
          <div
            className="absolute left-1 top-2 h-1.5 w-3 rounded-sm"
            style={{ backgroundColor: trim, boxShadow: `0 0 8px ${trim}` }}
          />
        </div>
        <div className="h-5 w-3 rounded-sm opacity-90" style={{ backgroundColor: trim }} />
      </div>
      <div className="relative h-[4.25rem] w-[5.25rem] rounded-t-lg border-2 border-cyan-900/50" style={{ backgroundColor: body }}>
        <div className="absolute -right-0.5 top-3 h-12 w-2.5 rounded-sm bg-slate-900/50" />
        <div
          className="absolute bottom-2 right-0 h-2 w-10 rounded-sm border border-cyan-400/40"
          style={{ backgroundColor: trim, opacity: 0.85 }}
        />
      </div>
      <div className="mt-0 flex gap-2.5">
        <div className="h-12 w-5 rounded-sm border border-black/15" style={{ backgroundColor: body }} />
        <div className="h-12 w-5 rounded-sm border border-black/15" style={{ backgroundColor: body }} />
      </div>
    </div>
  );
}

function EnemySilhouette({
  type,
  color,
  hit,
  faceToward = "right",
}: {
  type: "zaku" | "gm" | "turret" | "unknown" | "gouf";
  color: string;
  hit: boolean;
  faceToward?: "left" | "right";
}) {
  const base = `transition-transform duration-200 ${hit ? "scale-95 brightness-125" : "scale-100"}`;
  let inner: ReactNode;
  if (type === "turret") {
    inner = (
      <div className={`flex flex-col items-center ${base}`}>
        <div className="h-6 w-16 rounded-t-sm" style={{ backgroundColor: color }} />
        <div className="h-10 w-24 rounded-sm border-2 border-black/40" style={{ backgroundColor: color }} />
        <div className="mt-1 h-3 w-32 rounded-sm bg-black/50" />
      </div>
    );
  } else if (type === "unknown") {
    inner = (
      <div
        className={`h-28 w-20 rounded-lg border-2 border-dashed border-amber-500/40 ${base}`}
        style={{ backgroundColor: `${color}99` }}
      />
    );
  } else {
    inner = (
      <div className={`flex flex-col items-center ${base}`}>
        <div className="mb-1 flex gap-3">
          <div className="h-8 w-5 rounded-sm" style={{ backgroundColor: color }} />
          <div className="h-6 w-4 rounded-sm opacity-80" style={{ backgroundColor: color }} />
        </div>
        <div className="relative h-16 w-20 rounded-t-lg border-2 border-black/30" style={{ backgroundColor: color }}>
          {type === "zaku" && <div className="absolute -right-1 top-2 h-10 w-3 rounded-sm bg-black/40" />}
          {type === "gouf" && <div className="absolute -left-2 top-6 h-2 w-8 rounded-sm bg-amber-900/80" />}
        </div>
        <div className="mt-0 flex gap-2">
          <div className="h-12 w-5 rounded-sm" style={{ backgroundColor: color }} />
          <div className="h-12 w-5 rounded-sm" style={{ backgroundColor: color }} />
        </div>
      </div>
    );
  }
  if (faceToward === "left") {
    return <div className="inline-block scale-x-[-1]">{inner}</div>;
  }
  return <>{inner}</>;
}
