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
  "浮游炮 齐射！",
  "盾击冲撞！",
  "霰弹近炸！",
  "回旋踢与肘击！",
  "肩炮点射！",
  "磁轨钉刺！",
  "导弹巢 扇面覆盖！",
  "粒子军刀 上段斩！",
  "膝撞与抓投！",
  "冷却槽全开的全力齐射！",
  "侧向滑步后的迎头痛击！",
  "诱敌深入后的反击！",
];

const ENEMY_ACTIONS = [
  "电热鞭扫击！",
  "火箭筒反击！",
  "三连射！",
  "冲撞！",
  "米加粒子炮 蓄力射击！",
  "飞弹诱导 夹击！",
  "链锯横扫！",
  "压顶重砸！",
  "扩散光束！",
  "爪刃连刺！",
  "尾刃甩击！",
  "肩炮速射！",
  "烟幕里突然的近身！",
  "浮游单元 骚扰射击！",
  "地脉共振 震波！",
  "龙颚般的钳咬！",
];

/** 过程战报：我方命中后的随机旁白（非终结） */
const PLAYER_HIT_EXTRAS = [
  "，打得特别准！",
  "，对手装甲上爆出火花！",
  "，对手被震得往后退！",
  "，读数一下子跳了一大截！",
  "，对手姿态有点乱了！",
  "，这一下连 HUD 都闪了一下！",
  "，对手侧甲凹下去一块！",
];

const PLAYER_HIT_EXTRAS_CRIT = [
  "，是特别猛的一击！",
  "，对手差点被掀翻！",
  "，屏幕上都闪光了！",
  "，连地面都跟着震了一下！",
  "，对手武器都握不稳了！",
];

const ENEMY_HIT_SITUATIONS = [
  "",
  "侧翼来袭",
  "正上方",
  "烟幕里突然",
  "读数突然飙红",
  "雷达上多了好几个红点",
  "距离一下子被压到很近",
  "我们刚换弹的空档",
];

const ENEMY_OPENING_SITUATIONS = ["抢先动手", "趁我们还没站稳", "来势汹汹", "第一波就压上来"];

/** 我方闪避敌方攻击（体力不变）；atk 为敌方本回合使用的招式（宜来自其技能表） */
function randomPlayerDodgeLine(enemyAttack: string): string {
  const atk = enemyAttack;
  return randomPick([
    `【我方】${atk}擦身而过，我们惊险闪避！`,
    `【我方】急推操纵杆横向滑移，${atk}只打中了空处！`,
    `【我方】${atk}来了，我们侧向滑步躲开！`,
    `【我方】${atk}被我们看穿了，提前闪开！`,
    `【我方】${atk}掠过装甲外侧，好险！`,
    `【我方】${atk}贴着座舱盖飞过，我们低头躲过！`,
    `【我方】推进器短点喷射，${atk}从脚下扫空！`,
    `【我方】${atk}在掩体上炸开，我们已先一步撤出！`,
  ]);
}

/** 敌方闪避我方攻击（体力不变） */
function randomEnemyDodgeLine(): string {
  const ours = randomPick(PLAYER_ACTIONS);
  return randomPick([
    `【敌方】${ours}被闪掉了，对方溜得很快！`,
    `【敌方】${ours}落空，对方侧向滑移躲开了！`,
    `【敌方】${ours}只打中残影，对方已经换位！`,
    `【敌方】${ours}差一点点，对方急退避开了！`,
    `【敌方】对方急退加翻滚，${ours}没打中！`,
    `【敌方】${ours}打在空处，对方像泥鳅一样滑走了！`,
    `【敌方】对方预判了我们的弹道，${ours}被躲开了！`,
    `【敌方】${ours}掠过，对方缩进掩体后沿！`,
  ]);
}

/** 开战前氛围（随机一条） */
const COMBAT_ATMOSPHERE_LINES = [
  "推进器预热完毕，关节液压正常。",
  "火控锁定目标，弹匣上膛。",
  "护盾展开，姿态控制切换到战斗模式。",
  "雷达噪声有点大……但目标轮廓已经清晰。",
  "座舱里只剩下自己的呼吸和警报的滴答声。",
  "侧风不小，机体微微晃动，但准星稳稳咬住对方。",
];

const BATTLE_START_LINES = [
  "战斗开始啦！",
  "交火！",
  "双方开始交火！",
  "第一回合！",
  "来吧，别留情！",
];

/** 语音收尾（与屏幕大字可略有不同，增加听感变化） */
const CLOSING_VOICE_WIN = [
  "任务完成，敌机击坠。",
  "目标沉默，可以收队了。",
  "敌机信号消失，我们赢了。",
  "威胁解除，干得漂亮。",
];

const CLOSING_VOICE_LOSE = [
  "警告，机体大破。",
  "损伤过大，先撤！",
  "座机严重受损，请尽快脱离！",
  "操纵困难，优先保全驾驶员！",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** 敌方招式文案：优先从对手配置的技能中随机，否则用通用敌方动作池 */
function randomEnemyAttackLabel(skills: readonly string[]): string {
  const list = skills.map((s) => s.trim()).filter(Boolean);
  if (list.length > 0) return randomPick(list);
  return randomPick(ENEMY_ACTIONS);
}

function randomFinishWinLine(): string {
  const a = randomPick(PLAYER_ACTIONS);
  return randomPick([
    `【我方】${a}使出终结一击，敌人被击落啦！`,
    `【我方】${a}最后一击命中要害，敌人被击落啦！`,
    `【我方】${a}补上关键一击，敌机被击落啦！`,
    `【我方】${a}终结连段，敌机坠落！`,
  ]);
}

function randomFinishLoseLine(enemyAttack: string): string {
  const a = enemyAttack;
  return randomPick([
    `【敌方】${a}使出致命一击，我们遭到重创！`,
    `【敌方】${a}致命一击落下，我们遭到重创！`,
    `【敌方】${a}抓住破绽，我们遭到重创！`,
    `【敌方】${a}重击破甲，我们遭到重创！`,
  ]);
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
      signal?.removeEventListener("abort", onAbort);
      setBattleBgmDucked(false);
      resolve();
    };

    const onAbort = () => {
      synth.cancel();
      finish();
    };
    signal?.addEventListener("abort", onAbort);

    synth.cancel();
    setBattleBgmDucked(true);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.88;
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
    const speechAbort = new AbortController();
    const useSpeech = battleSpeechSupported();
    const paceMs = reduceMotion ? 520 : 880;
    /** 朗读：一句念完再留白，方便小朋友跟上 */
    const pauseAfterSpokenLineMs = reduceMotion ? 900 : 2000;

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

      const steps: {
        side: "player" | "enemy";
        p: number;
        e: number;
        line: string;
        crit?: boolean;
        dodge?: boolean;
      }[] =
        serverBattle.outcome === "WIN"
          ? [
              {
                side: "player",
                p: 100,
                e: 72,
                line: battleLinePlayerHit(
                  randomPick(PLAYER_ACTIONS),
                  28,
                  randomPick(PLAYER_HIT_EXTRAS_CRIT),
                ),
                crit: true,
              },
              {
                side: "enemy",
                p: 100,
                e: 72,
                line: randomPlayerDodgeLine(randomEnemyAttackLabel(serverBattle.enemy.skills)),
                dodge: true,
              },
              {
                side: "enemy",
                p: 82,
                e: 72,
                line: battleLineEnemyHit(
                  randomEnemyAttackLabel(serverBattle.enemy.skills),
                  18,
                  randomPick(ENEMY_HIT_SITUATIONS),
                ),
              },
              {
                side: "player",
                p: 82,
                e: 38,
                line: battleLinePlayerHit(
                  randomPick(PLAYER_ACTIONS),
                  34,
                  randomPick(PLAYER_HIT_EXTRAS),
                ),
              },
              {
                side: "enemy",
                p: 64,
                e: 38,
                line: battleLineEnemyHit(
                  randomEnemyAttackLabel(serverBattle.enemy.skills),
                  18,
                  randomPick(ENEMY_HIT_SITUATIONS),
                ),
              },
              {
                side: "player",
                p: 64,
                e: 0,
                line: randomFinishWinLine(),
                crit: true,
              },
            ]
          : [
              {
                side: "enemy",
                p: 78,
                e: 100,
                line: battleLineEnemyHit(
                  randomEnemyAttackLabel(serverBattle.enemy.skills),
                  22,
                  randomPick(ENEMY_OPENING_SITUATIONS),
                ),
              },
              {
                side: "player",
                p: 78,
                e: 100,
                line: randomEnemyDodgeLine(),
                dodge: true,
              },
              {
                side: "player",
                p: 78,
                e: 68,
                line: battleLinePlayerHit(
                  randomPick(PLAYER_ACTIONS),
                  32,
                  randomPick(PLAYER_HIT_EXTRAS),
                ),
              },
              {
                side: "enemy",
                p: 52,
                e: 68,
                line: battleLineEnemyHit(
                  randomEnemyAttackLabel(serverBattle.enemy.skills),
                  26,
                  randomPick(ENEMY_HIT_SITUATIONS),
                ),
              },
              {
                side: "player",
                p: 52,
                e: 40,
                line: battleLinePlayerHit(
                  randomPick(PLAYER_ACTIONS),
                  28,
                  randomPick(PLAYER_HIT_EXTRAS),
                ),
              },
              {
                side: "enemy",
                p: 0,
                e: 40,
                line: randomFinishLoseLine(randomEnemyAttackLabel(serverBattle.enemy.skills)),
              },
            ];

      for (const s of steps) {
        if (cancelled) return;
        setHp({ p: s.p, e: s.e, eMax: 100 });
        setLog((prev) => [...prev.slice(-12), s.line]);
        triggerFx(s.side, !s.dodge && Boolean(s.crit));
        await afterLine(s.line);
      }

      if (cancelled) return;
      await new Promise<void>((r) => window.setTimeout(r, reduceMotion ? 200 : 420));
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
              {phase === "victory" &&
                itemRewardLines(serverBattle.rewards).map((it, i) => {
                  const label = it.name?.trim() || it.itemSlug;
                  const q = typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1;
                  return (
                    <p
                      key={`item-reward-${i}-${it.itemSlug}`}
                      className="w-full text-center text-xs font-bold text-fuchsia-300/95"
                    >
                      获得道具 {label}
                      {q > 1 ? ` ×${q}` : ""}
                    </p>
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
