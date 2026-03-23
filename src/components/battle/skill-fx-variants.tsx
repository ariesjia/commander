"use client";

import { normalizeSkillFxVariant, type SkillFxVariant } from "@/components/battle/battle-fx-types";

type VProps = { variant: SkillFxVariant; animClass: string };

/** 治疗：0 生机绿 / 1 冷蓝纳米 / 2 暖白回充 */
export function HealFxVariantLayer({ variant: vIn, animClass }: VProps) {
  const v = normalizeSkillFxVariant(vIn);
  return (
    <div className={`relative h-36 w-36 ${animClass}`}>
      {v === 0 && (
        <>
          <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(167,243,208,0.55)_0%,rgba(45,212,191,0.28)_42%,rgba(16,185,129,0.08)_62%,transparent_78%)] shadow-[0_0_40px_rgba(52,211,153,0.45)]" />
          <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-emerald-300/40" />
        </>
      )}
      {v === 1 && (
        <>
          <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(186,230,253,0.5)_0%,rgba(56,189,248,0.3)_40%,rgba(14,165,233,0.1)_65%,transparent_80%)] shadow-[0_0_36px_rgba(56,189,248,0.5)]" />
          <div className="pointer-events-none absolute inset-[12%] rounded-full border border-cyan-200/50 bg-[repeating-conic-gradient(from_0deg,transparent_0deg,rgba(165,243,252,0.08)_12deg,transparent_24deg)]" />
        </>
      )}
      {v === 2 && (
        <>
          <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(254,252,232,0.45)_0%,rgba(217,249,157,0.35)_38%,rgba(132,204,22,0.12)_62%,transparent_78%)] shadow-[0_0_38px_rgba(190,242,100,0.4)]" />
          <div className="pointer-events-none absolute inset-[18%] rounded-full border-2 border-lime-200/45" />
        </>
      )}
    </div>
  );
}

/** 牵制：0 紫扫描 / 1 红噪 / 2 青绿 telemetry 扰动 */
export function ControlFxVariantLayer({ variant: vIn, animClass }: VProps) {
  const v = normalizeSkillFxVariant(vIn);
  return (
    <div className={`relative h-40 w-40 overflow-hidden rounded-full ${animClass}`}>
      {v === 0 && (
        <>
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(139,92,246,0.12)_3px,rgba(139,92,246,0.12)_5px)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(192,132,252,0.22)_0%,rgba(91,33,182,0.35)_45%,transparent_70%)] shadow-[0_0_32px_rgba(168,85,247,0.4)]" />
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-fuchsia-400/50 shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
        </>
      )}
      {v === 1 && (
        <>
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(248,113,113,0.14)_2px,rgba(248,113,113,0.14)_4px)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.2)_0%,rgba(127,29,29,0.25)_50%,transparent_72%)] shadow-[0_0_28px_rgba(248,113,113,0.45)]" />
          <div className="absolute inset-x-[15%] top-[40%] h-2 -translate-y-1/2 rounded-full bg-rose-400/35 blur-[2px]" />
        </>
      )}
      {v === 2 && (
        <>
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent,transparent_4px,rgba(52,211,153,0.1)_4px,rgba(52,211,153,0.1)_6px)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.18)_0%,rgba(59,130,246,0.2)_48%,transparent_70%)]" />
          <div className="absolute inset-[20%] rounded-md border border-emerald-400/30 opacity-80" />
        </>
      )}
    </div>
  );
}

/** 防御：0 斜方盾 / 1 正圆叠层 / 2 竖条屏障 */
export function DefenseFxVariantLayer({ variant: vIn, animClass }: VProps) {
  const v = normalizeSkillFxVariant(vIn);
  return (
    <div className={`relative h-40 w-40 ${animClass}`}>
      {v === 0 && (
        <>
          <div className="absolute inset-[12%] rotate-45 rounded-xl border-[3px] border-sky-300/70 bg-[linear-gradient(135deg,rgba(56,189,248,0.35)_0%,rgba(14,165,233,0.12)_45%,rgba(30,58,138,0.2)_100%)] shadow-[0_0_36px_rgba(56,189,248,0.55),inset_0_0_24px_rgba(125,211,252,0.25)]" />
          <div className="pointer-events-none absolute inset-[18%] rounded-2xl border border-cyan-200/35 bg-[radial-gradient(circle,rgba(224,242,254,0.2)_0%,transparent_65%)]" />
        </>
      )}
      {v === 1 && (
        <>
          <div className="absolute inset-[10%] rounded-full border-[3px] border-blue-300/65 bg-[radial-gradient(circle,rgba(96,165,250,0.28)_0%,rgba(30,64,175,0.18)_55%,transparent_72%)] shadow-[0_0_32px_rgba(59,130,246,0.5)]" />
          <div className="pointer-events-none absolute inset-[22%] rounded-full border-2 border-sky-200/40" />
          <div className="pointer-events-none absolute inset-[34%] rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.25)_0%,transparent_70%)]" />
        </>
      )}
      {v === 2 && (
        <>
          <div className="absolute inset-y-[8%] left-1/2 w-[42%] -translate-x-1/2 rounded-lg border-2 border-cyan-300/70 bg-[linear-gradient(180deg,rgba(56,189,248,0.25)_0%,rgba(14,165,233,0.15)_50%,rgba(30,58,138,0.22)_100%)] shadow-[0_0_30px_rgba(34,211,238,0.45)]" />
          <div className="pointer-events-none absolute inset-y-[14%] left-1/2 w-[28%] -translate-x-1/2 rounded-md border border-white/20" />
        </>
      )}
    </div>
  );
}

type BuffProps = VProps & { style: "buff" | "support" };

/** 增益/支援：各 3 套色调与几何，随 variant 切换 */
export function BuffFxVariantLayer({ variant: vIn, style, animClass }: BuffProps) {
  const v = normalizeSkillFxVariant(vIn);
  if (style === "support") {
    return (
      <div className={`relative h-40 w-40 ${animClass}`}>
        {v === 0 && (
          <>
            <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.38)_0%,rgba(99,102,241,0.22)_42%,transparent_68%)] shadow-[0_0_38px_rgba(34,211,238,0.45)]" />
            <div className="pointer-events-none absolute inset-[22%] rounded-full border-2 border-violet-300/50 border-dashed opacity-90" />
            <div className="pointer-events-none absolute inset-[32%] rounded-full border border-cyan-200/40" />
          </>
        )}
        {v === 1 && (
          <>
            <div className="absolute inset-[6%] rounded-full border-2 border-sky-400/45 bg-[radial-gradient(circle,rgba(56,189,248,0.22)_0%,rgba(37,99,235,0.2)_50%,transparent_72%)]" />
            <div className="pointer-events-none absolute inset-[18%] rounded-full border border-dashed border-indigo-300/50" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(34,211,238,0.12),transparent)]" />
          </>
        )}
        {v === 2 && (
          <>
            <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.32)_0%,rgba(20,184,166,0.15)_55%,transparent_75%)] shadow-[0_0_34px_rgba(45,212,191,0.4)]" />
            <div className="pointer-events-none absolute inset-[25%] rounded-full border border-teal-300/45" />
            <div className="pointer-events-none absolute inset-x-[20%] top-[38%] h-0.5 bg-teal-200/50 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
          </>
        )}
      </div>
    );
  }
  return (
    <div className={`relative h-40 w-40 ${animClass}`}>
      {v === 0 && (
        <>
          <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.5)_0%,rgba(245,158,11,0.28)_38%,rgba(180,83,9,0.12)_62%,transparent_76%)] shadow-[0_0_40px_rgba(251,191,36,0.55)]" />
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(251,146,60,0.15)_90deg,transparent_180deg,rgba(250,204,21,0.12)_270deg,transparent_360deg)]" />
        </>
      )}
      {v === 1 && (
        <>
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.45)_0%,rgba(234,88,12,0.25)_45%,transparent_72%)] shadow-[0_0_36px_rgba(249,115,22,0.5)]" />
          <div className="pointer-events-none absolute inset-x-[12%] top-[42%] h-3 rounded-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent blur-[1px]" />
          <div className="pointer-events-none absolute inset-x-[12%] top-[52%] h-2 rounded-full bg-gradient-to-r from-transparent via-orange-400/35 to-transparent blur-[1px]" />
        </>
      )}
      {v === 2 && (
        <>
          <div className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle,rgba(251,113,133,0.35)_0%,rgba(251,191,36,0.28)_40%,rgba(234,179,8,0.15)_65%,transparent_78%)] shadow-[0_0_38px_rgba(251,113,133,0.35)]" />
          <div className="pointer-events-none absolute inset-[20%] rotate-12 rounded-lg border-2 border-rose-300/40" />
        </>
      )}
    </div>
  );
}

/** ATTACK 技能台词：我方侧额外爆闪，与 strike 光束叠加（外层由 BattleArenaFx 定位） */
export function AttackSkillFxLayer({ variant: vIn, animClass }: VProps) {
  const v = normalizeSkillFxVariant(vIn);
  return (
    <div className={`pointer-events-none relative flex h-36 w-36 items-center justify-center ${animClass}`}>
      {v === 0 && (
        <div className="relative h-32 w-32">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(34,211,238,0.35)_35%,transparent_65%)] shadow-[0_0_28px_rgba(255,255,255,0.75)]" />
          <div className="absolute inset-[22%] rounded-full border-2 border-white/70" />
        </div>
      )}
      {v === 1 && (
        <div className="relative h-36 w-36">
          <div className="absolute inset-[5%] rounded-full border-[3px] border-fuchsia-400/60 bg-[radial-gradient(circle,transparent_40%,rgba(217,70,239,0.25)_70%,transparent_85%)] shadow-[0_0_32px_rgba(217,70,239,0.55)]" />
          <div className="absolute inset-[28%] rounded-full bg-fuchsia-200/25 blur-md" />
        </div>
      )}
      {v === 2 && (
        <div className="relative flex h-32 w-32 items-center justify-center gap-2">
          <div className="h-16 w-2 rounded-full bg-gradient-to-b from-cyan-200 via-white to-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
          <div className="h-20 w-2 rounded-full bg-gradient-to-b from-amber-200 via-white to-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.85)]" />
          <div className="h-16 w-2 rounded-full bg-gradient-to-b from-cyan-200 via-white to-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
        </div>
      )}
    </div>
  );
}
