import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { mechaSkillKindLabel } from "@/lib/mecha-skill-kind-labels";
import type { MechaSkill } from "@/lib/mecha-adoption";

type Tone = "parent" | "student";

const base: Record<
  Tone,
  {
    title: string;
    cardLocked: string;
    nameLocked: string;
    descLocked: string;
    meta: string;
    tagLocked: string;
  }
> = {
  parent: {
    title: "mb-2 text-sm font-medium text-p-text",
    cardLocked: "rounded-lg border border-p-border/50 bg-p-bg/50 p-3 opacity-75",
    nameLocked: "min-w-0 flex-1 font-medium text-p-text-secondary leading-snug",
    descLocked: "break-words text-xs text-p-text-secondary/80 leading-relaxed",
    meta: "mt-1 text-xs text-p-text-secondary",
    tagLocked: "shrink-0 rounded bg-p-bg px-2 py-0.5 text-[10px] text-p-text-secondary",
  },
  student: {
    title: "mb-2 text-sm font-medium text-s-text",
    cardLocked: "rounded-lg border border-s-primary/10 bg-white/[0.02] p-3 opacity-60",
    nameLocked: "min-w-0 flex-1 font-medium text-s-text-secondary leading-snug",
    descLocked: "break-words text-xs text-s-text-secondary/70 leading-relaxed",
    meta: "mt-1 text-xs text-s-text-secondary",
    tagLocked: "shrink-0 rounded bg-white/10 px-2 py-0.5 text-[10px] text-s-text-secondary",
  },
};

/** 解锁后按技能类型的卡片 / 类型标签 / 技能名 / 描述 */
const unlockedByKind: Record<
  string,
  {
    parent: { card: string; tag: string; name: string; desc: string };
    student: { card: string; tag: string; name: string; desc: string };
  }
> = {
  ATTACK: {
    parent: {
      card: "rounded-lg border border-red-200/90 bg-red-50/50 p-3 shadow-sm",
      tag: "shrink-0 rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800",
      name: "min-w-0 flex-1 font-medium text-red-950 leading-snug",
      desc: "break-words text-xs text-red-900/75 leading-relaxed",
    },
    student: {
      card: "rounded-lg border border-red-500/30 bg-red-500/[0.08] p-3 shadow-sm",
      tag: "shrink-0 rounded bg-red-500/25 px-2 py-0.5 text-[10px] font-medium text-red-300",
      name: "min-w-0 flex-1 font-medium text-red-200 leading-snug",
      desc: "break-words text-xs text-red-200/70 leading-relaxed",
    },
  },
  HEAL: {
    parent: {
      card: "rounded-lg border border-emerald-200/90 bg-emerald-50/50 p-3 shadow-sm",
      tag: "shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800",
      name: "min-w-0 flex-1 font-medium text-emerald-950 leading-snug",
      desc: "break-words text-xs text-emerald-900/75 leading-relaxed",
    },
    student: {
      card: "rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] p-3 shadow-sm",
      tag: "shrink-0 rounded bg-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-300",
      name: "min-w-0 flex-1 font-medium text-emerald-200 leading-snug",
      desc: "break-words text-xs text-emerald-200/70 leading-relaxed",
    },
  },
  DEFENSE: {
    parent: {
      card: "rounded-lg border border-blue-200/90 bg-blue-50/50 p-3 shadow-sm",
      tag: "shrink-0 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800",
      name: "min-w-0 flex-1 font-medium text-blue-950 leading-snug",
      desc: "break-words text-xs text-blue-900/75 leading-relaxed",
    },
    student: {
      card: "rounded-lg border border-sky-500/30 bg-sky-500/[0.08] p-3 shadow-sm",
      tag: "shrink-0 rounded bg-sky-500/25 px-2 py-0.5 text-[10px] font-medium text-sky-300",
      name: "min-w-0 flex-1 font-medium text-sky-200 leading-snug",
      desc: "break-words text-xs text-sky-200/70 leading-relaxed",
    },
  },
  BUFF: {
    parent: {
      card: "rounded-lg border border-amber-200/90 bg-amber-50/45 p-3 shadow-sm",
      tag: "shrink-0 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900",
      name: "min-w-0 flex-1 font-medium text-amber-950 leading-snug",
      desc: "break-words text-xs text-amber-900/75 leading-relaxed",
    },
    student: {
      card: "rounded-lg border border-amber-500/30 bg-amber-500/[0.08] p-3 shadow-sm",
      tag: "shrink-0 rounded bg-amber-500/25 px-2 py-0.5 text-[10px] font-medium text-amber-300",
      name: "min-w-0 flex-1 font-medium text-amber-200 leading-snug",
      desc: "break-words text-xs text-amber-200/70 leading-relaxed",
    },
  },
  CONTROL: {
    parent: {
      card: "rounded-lg border border-violet-200/90 bg-violet-50/50 p-3 shadow-sm",
      tag: "shrink-0 rounded bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-800",
      name: "min-w-0 flex-1 font-medium text-violet-950 leading-snug",
      desc: "break-words text-xs text-violet-900/75 leading-relaxed",
    },
    student: {
      card: "rounded-lg border border-violet-500/30 bg-violet-500/[0.08] p-3 shadow-sm",
      tag: "shrink-0 rounded bg-violet-500/25 px-2 py-0.5 text-[10px] font-medium text-violet-300",
      name: "min-w-0 flex-1 font-medium text-violet-200 leading-snug",
      desc: "break-words text-xs text-violet-200/70 leading-relaxed",
    },
  },
  SUPPORT: {
    parent: {
      card: "rounded-lg border border-teal-200/90 bg-teal-50/45 p-3 shadow-sm",
      tag: "shrink-0 rounded bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-800",
      name: "min-w-0 flex-1 font-medium text-teal-950 leading-snug",
      desc: "break-words text-xs text-teal-900/75 leading-relaxed",
    },
    student: {
      card: "rounded-lg border border-teal-500/30 bg-teal-500/[0.08] p-3 shadow-sm",
      tag: "shrink-0 rounded bg-teal-500/25 px-2 py-0.5 text-[10px] font-medium text-teal-300",
      name: "min-w-0 flex-1 font-medium text-teal-200 leading-snug",
      desc: "break-words text-xs text-teal-200/70 leading-relaxed",
    },
  },
};

function unlockedPalette(kind: string, tone: Tone) {
  const row = unlockedByKind[kind];
  if (row) return tone === "parent" ? row.parent : row.student;
  if (tone === "parent") {
    return {
      card: "rounded-lg border border-p-accent/25 bg-p-accent/5 p-3 shadow-sm",
      tag: "shrink-0 rounded bg-p-accent/10 px-2 py-0.5 text-[10px] font-medium text-p-accent",
      name: "min-w-0 flex-1 font-medium text-p-text leading-snug",
      desc: "break-words text-xs text-p-text-secondary leading-relaxed",
    };
  }
  return {
    card: "rounded-lg border border-s-primary/25 bg-s-primary/10 p-3 shadow-sm",
    tag: "shrink-0 rounded bg-s-primary/20 px-2 py-0.5 text-[10px] font-medium text-s-primary",
    name: "min-w-0 flex-1 font-medium text-s-text leading-snug",
    desc: "break-words text-xs text-s-text-secondary leading-relaxed",
  };
}

/** 当前形态等级序号（0～7），与 `MechaLevel.level` 一致；不在 UI 写「Lv」以免与技能等级混淆 */
export function MechaSkillList({
  skills,
  currentLevelNum,
  tone,
  showPinyin = false,
}: {
  skills: MechaSkill[] | undefined;
  currentLevelNum: number;
  tone: Tone;
  /** 仅学生端生效；家长端技能名始终不注音 */
  showPinyin?: boolean;
}) {
  const list = skills?.length ? [...skills].sort((a, b) => a.unlockLevel - b.unlockLevel) : [];
  if (!list.length) return null;

  const b = base[tone];
  const pinyinOnName = tone === "student" && showPinyin;

  return (
    <div className="mt-4 min-w-0">
      <p className={b.title}>技能</p>
      <div className="space-y-2">
        {list.map((sk) => {
          const unlocked = currentLevelNum >= sk.unlockLevel;
          const pal = unlocked ? unlockedPalette(sk.kind, tone) : null;

          const cardClass = unlocked && pal ? pal.card : b.cardLocked;
          const tagClass = unlocked && pal ? pal.tag : b.tagLocked;
          const nameClass = unlocked && pal ? pal.name : b.nameLocked;
          const descClass = unlocked && pal ? pal.desc : b.descLocked;

          return (
            <div key={sk.slug} className={cardClass}>
              <div className="flex min-w-0 items-start gap-2">
                <span className={`${tagClass} shrink-0`}>{mechaSkillKindLabel(sk.kind)}</span>
                <p className={nameClass}>
                  <TextWithPinyin text={sk.name} showPinyin={pinyinOnName} />
                </p>
                {!unlocked && (
                  <span className={`${b.tagLocked} ml-auto shrink-0`}>未解锁</span>
                )}
              </div>
              <p className={`mt-1.5 ${descClass}`}>{sk.description}</p>
              {!unlocked && (
                <p className={b.meta}>机甲形态达到阶段 {sk.unlockLevel} 时解锁</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
