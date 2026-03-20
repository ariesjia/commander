"use client";

/* Battle UI syncs phase/HP/log from intervals and image URL changes; setState in effects is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";
import { setBattleBgmDucked } from "@/lib/battle-bgm-bridge";

const PLAYER_ACTIONS = [
  "光束步枪 射击！",
  "军刀斩击！",
  "副武装 连射！",
  "推进器突进！",
  "火神炮牵制！",
];

const ENEMY_ACTIONS = [
  "电热鞭扫击！",
  "火箭筒反击！",
  "三连射！",
  "冲撞！",
  "米加粒子炮 蓄力射击！",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** 战报用于屏幕与朗读，避免「负 26」等 TTS 难懂说法 */
function battleLinePlayerHit(action: string, enemyLostHp: number, extra = "") {
  return `【我方】${action}打中啦，敌人少了${enemyLostHp}点体力${extra}`;
}
function battleLineEnemyHit(action: string, weLostHp: number, situation = "") {
  const lead = situation ? `${situation}，` : "";
  return `【敌方】${action}${lead}我们少了${weLostHp}点体力`;
}

function battleSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

/**
 * 朗读一行战报（仅 cancel 语音队列，不影响 BGM）。
 * 朗读时略压低 BGM，结束后恢复，便于与循环 BGM 同时听清。
 */
function speakBattleLine(text: string): Promise<void> {
  if (!battleSpeechSupported()) return Promise.resolve();
  const synth = window.speechSynthesis;
  return new Promise((resolve) => {
    synth.cancel();
    setBattleBgmDucked(true);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.88;
    const voices = synth.getVoices();
    const zh =
      voices.find((v) => v.lang === "zh-CN") ?? voices.find((v) => v.lang.startsWith("zh"));
    if (zh) u.voice = zh;
    const done = () => {
      setBattleBgmDucked(false);
      resolve();
    };
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  });
}


export type ServerBattlePayload = {
  outcome: "WIN" | "LOSE";
  narrative: string;
  enemy: { name: string; imageUrl: string; skills: string[] };
  pointsAwarded?: number;
};

type Phase = "ready" | "fighting" | "victory" | "defeat";

type BeamSide = "none" | "player" | "enemy";

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
};

export function MechaBattle({
  playerMechaName,
  playerSlug,
  playerMechaPoints,
  onExit,
  serverBattle = null,
  externalFlow = false,
  onBattlePresentationComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
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
  const [shake, setShake] = useState<"none" | "player" | "enemy">("none");
  const [flash, setFlash] = useState<"none" | "hit" | "crit">("none");
  const [beam, setBeam] = useState<BeamSide>("none");
  const [beamKey, setBeamKey] = useState(0);
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

  const triggerFx = useCallback(
    (side: "player" | "enemy", crit: boolean) => {
      setBeam(side);
      setBeamKey((k) => k + 1);
      window.setTimeout(() => setBeam("none"), reduceMotion ? 120 : 450);
      setShake(side === "player" ? "enemy" : "player");
      setFlash(crit && side === "player" ? "crit" : "hit");
      window.setTimeout(
        () => {
          setShake("none");
          setFlash("none");
        },
        reduceMotion ? 80 : 220,
      );
    },
    [reduceMotion],
  );

  /** 服务端裁决模式：逐条战报；支持朗读时读完一行再进入下一回合 */
  useEffect(() => {
    if (!serverBattle || externalFlow === false) return;

    clearTick();
    let cancelled = false;
    const useSpeech = battleSpeechSupported();
    const paceMs = reduceMotion ? 520 : 880;
    /** 朗读：一句念完再留白，方便小朋友跟上 */
    const pauseAfterSpokenLineMs = reduceMotion ? 900 : 2000;

    const afterLine = async (line: string) => {
      if (cancelled) return;
      if (useSpeech) {
        await speakBattleLine(line);
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
        "战斗开始啦！",
      ];

      for (const line of openLines) {
        if (cancelled) return;
        setLog((prev) => [...prev, line]);
        await afterLine(line);
      }

      const steps: { side: "player" | "enemy"; p: number; e: number; line: string; crit?: boolean }[] =
        serverBattle.outcome === "WIN"
          ? [
              {
                side: "player",
                p: 100,
                e: 72,
                line: battleLinePlayerHit(randomPick(PLAYER_ACTIONS), 28, "，是特别猛的一击！"),
                crit: true,
              },
              {
                side: "enemy",
                p: 82,
                e: 72,
                line: battleLineEnemyHit(randomPick(ENEMY_ACTIONS), 18),
              },
              {
                side: "player",
                p: 82,
                e: 38,
                line: battleLinePlayerHit(randomPick(PLAYER_ACTIONS), 34),
              },
              {
                side: "enemy",
                p: 64,
                e: 38,
                line: battleLineEnemyHit(randomPick(ENEMY_ACTIONS), 18),
              },
              {
                side: "player",
                p: 64,
                e: 0,
                line: `【我方】${randomPick(PLAYER_ACTIONS)}使出终结一击，敌人被击落啦！`,
                crit: true,
              },
            ]
          : [
              {
                side: "enemy",
                p: 78,
                e: 100,
                line: battleLineEnemyHit(randomPick(ENEMY_ACTIONS), 22, "抢先动手"),
              },
              {
                side: "player",
                p: 78,
                e: 68,
                line: battleLinePlayerHit(randomPick(PLAYER_ACTIONS), 32, "，这是反击打中的！"),
              },
              {
                side: "enemy",
                p: 52,
                e: 68,
                line: battleLineEnemyHit(randomPick(ENEMY_ACTIONS), 26),
              },
              {
                side: "player",
                p: 52,
                e: 40,
                line: battleLinePlayerHit(randomPick(PLAYER_ACTIONS), 28),
              },
              {
                side: "enemy",
                p: 0,
                e: 40,
                line: `【敌方】${randomPick(ENEMY_ACTIONS)}使出致命一击，我们遭到重创！`,
              },
            ];

      for (const s of steps) {
        if (cancelled) return;
        setHp({ p: s.p, e: s.e, eMax: 100 });
        setLog((prev) => [...prev.slice(-12), s.line]);
        triggerFx(s.side, Boolean(s.crit));
        await afterLine(s.line);
      }

      if (cancelled) return;
      await new Promise<void>((r) => window.setTimeout(r, reduceMotion ? 200 : 420));
      if (cancelled) return;

      setPhase(serverBattle.outcome === "WIN" ? "victory" : "defeat");

      if (useSpeech) {
        await speakBattleLine(serverBattle.narrative);
        if (cancelled) return;
        await new Promise<void>((r) => window.setTimeout(r, pauseAfterSpokenLineMs));
        if (
          serverBattle.outcome === "WIN" &&
          serverBattle.pointsAwarded != null &&
          serverBattle.pointsAwarded > 0
        ) {
          if (cancelled) return;
          await speakBattleLine(`获得积分 ${serverBattle.pointsAwarded} 分`);
          if (cancelled) return;
          await new Promise<void>((r) => window.setTimeout(r, pauseAfterSpokenLineMs));
        }
        if (cancelled) return;
        await speakBattleLine(
          serverBattle.outcome === "WIN" ? "任务完成，敌机击坠。" : "警告，机体大破。",
        );
      }
      if (!cancelled) onBattlePresentationComplete?.();
    };

    void run();

    return () => {
      cancelled = true;
      clearTick();
      if (typeof window !== "undefined" && battleSpeechSupported()) {
        window.speechSynthesis.cancel();
      }
    };
  }, [serverBattle, externalFlow, reduceMotion, triggerFx, clearTick, onBattlePresentationComplete]);

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
        {!reduceMotion && (
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.08) 2px, rgba(0,212,255,0.08) 4px)",
            }}
          />
        )}
        {flash !== "none" && (
          <div
            className={`pointer-events-none absolute inset-0 z-20 ${
              flash === "crit" ? "bg-amber-400/30" : "bg-cyan-400/22"
            } animate-battle-flash`}
          />
        )}
        {!reduceMotion && beam !== "none" && (
          <>
            <div
              key={`beam-${beamKey}`}
              className={`pointer-events-none absolute top-[40%] left-[5%] z-[15] h-4 w-[90%] overflow-hidden ${
                beam === "player" ? "animate-battle-beam-ltr" : "animate-battle-beam-rtl"
              }`}
              aria-hidden
            >
              <div
                className={`h-full w-full rounded-full blur-[2px] ${
                  beam === "player"
                    ? "bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                    : "bg-gradient-to-r from-transparent via-orange-400/85 to-transparent shadow-[0_0_22px_rgba(251,146,60,0.75)]"
                }`}
              />
            </div>
            <div
              key={`muzzle-${beamKey}`}
              className={`pointer-events-none absolute top-[36%] z-[17] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full animate-battle-muzzle ${
                beam === "player" ? "left-[22%]" : "left-[78%]"
              }`}
              style={{
                background:
                  beam === "player"
                    ? "radial-gradient(circle, rgba(165,243,252,0.95) 0%, rgba(34,211,238,0.4) 45%, transparent 70%)"
                    : "radial-gradient(circle, rgba(254,215,170,0.95) 0%, rgba(249,115,22,0.45) 45%, transparent 70%)",
              }}
              aria-hidden
            />
          </>
        )}
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
              shake === "player" ? "animate-battle-shake" : ""
            } ${!reduceMotion && fightingOrEnd && phase === "fighting" ? "animate-battle-threat-pulse" : ""}`}
          >
            <p className="mb-2 rounded bg-cyan-950/70 px-2 py-0.5 text-[10px] font-bold tracking-widest text-cyan-200/90 ring-1 ring-cyan-400/35">
              ALLY
            </p>
            <div
              className={
                !reduceMotion && phase === "fighting" && shake === "none"
                  ? "animate-battle-idle"
                  : ""
              }
            >
              {playerSlug && playerMechaLoading && !playerLevel ? (
                <div className="flex h-36 max-w-[9rem] flex-col items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-black/30 px-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/40 border-t-cyan-300" />
                  <span className="text-center text-[10px] text-cyan-200/70">同步机体…</span>
                </div>
              ) : playerImageUrl && !playerImgError ? (
                <div
                  className={`flex justify-center transition-transform duration-200 ${
                    shake === "player" ? "scale-95 brightness-125" : ""
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
                <PlayerSilhouette hit={shake === "player"} />
              )}
            </div>
            <p className="mt-3 max-w-[95%] truncate px-1 text-center text-[11px] font-bold tracking-wide text-cyan-100/90">
              {playerMechaName}
            </p>
          </div>

          <div
            className={`relative flex min-w-0 flex-1 flex-col items-center justify-end bg-gradient-to-bl from-amber-950/25 via-[#0a1628]/80 to-transparent ${arenaPad} ${
              shake === "enemy" ? "animate-battle-shake" : ""
            } ${!reduceMotion && fightingOrEnd && phase === "fighting" && showEnemy ? "animate-battle-threat-pulse-enemy" : ""}`}
          >
            {showEnemy ? (
              <>
                <p className="mb-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-200/95 ring-1 ring-amber-500/45">
                  TARGET
                </p>
                <div
                  className={
                    !reduceMotion && phase === "fighting" && shake === "none"
                      ? "animate-battle-idle"
                      : ""
                  }
                  style={{ animationDelay: "0.4s" }}
                >
                  {enemyImageUrl && !enemyImgError ? (
                    <div
                      className={`flex justify-center transition-transform duration-200 ${
                        shake === "enemy" ? "scale-95 brightness-125" : ""
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
                      hit={shake === "enemy"}
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
