import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { mechaSkillKindLabel } from "@/lib/mecha-skill-kind-labels";
import type { MechaSkill } from "@/lib/mecha-adoption";

type Tone = "parent" | "student";

const styles: Record<
  Tone,
  {
    title: string;
    card: string;
    cardLocked: string;
    badge: string;
    name: string;
    desc: string;
    meta: string;
    tag: string;
  }
> = {
  parent: {
    title: "mb-2 text-sm font-medium text-p-text",
    card: "rounded-lg border border-p-border bg-p-card p-3",
    cardLocked: "rounded-lg border border-p-border/50 bg-p-bg/50 p-3 opacity-70",
    badge: "shrink-0 rounded bg-p-accent/10 px-2 py-0.5 text-xs font-medium text-p-accent",
    name: "font-medium text-p-text",
    desc: "mt-1 break-words text-xs text-p-text-secondary leading-relaxed",
    meta: "mt-1 text-xs text-p-text-secondary",
    tag: "shrink-0 rounded bg-p-bg px-2 py-0.5 text-[10px] text-p-text-secondary",
  },
  student: {
    title: "mb-2 text-sm font-medium text-s-text",
    card: "rounded-lg border border-s-primary/20 bg-white/5 p-3",
    cardLocked: "rounded-lg border border-s-primary/10 bg-white/[0.02] p-3 opacity-60",
    badge: "shrink-0 rounded bg-s-primary/15 px-2 py-0.5 text-xs font-medium text-s-primary",
    name: "font-medium text-s-text",
    desc: "mt-1 break-words text-xs text-s-text-secondary leading-relaxed",
    meta: "mt-1 text-xs text-s-text-secondary",
    tag: "shrink-0 rounded bg-white/10 px-2 py-0.5 text-[10px] text-s-text-secondary",
  },
};

/** 当前形态等级序号（0～7），与 `MechaLevel.level` 一致 */
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

  const s = styles[tone];
  const pinyinOnName = tone === "student" && showPinyin;

  return (
    <div className="mt-4 min-w-0">
      <p className={s.title}>技能</p>
      <div className="space-y-2">
        {list.map((sk) => {
          const unlocked = currentLevelNum >= sk.unlockLevel;
          return (
            <div key={sk.slug} className={unlocked ? s.card : s.cardLocked}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={s.badge}>Lv.{sk.unlockLevel}</span>
                <span className={s.tag}>{mechaSkillKindLabel(sk.kind)}</span>
                {!unlocked && (
                  <span className={`${s.tag} ml-auto`}>未解锁</span>
                )}
              </div>
              <p className={`mt-2 ${s.name}`}>
                <TextWithPinyin text={sk.name} showPinyin={pinyinOnName} />
              </p>
              <p className={s.desc}>{sk.description}</p>
              {!unlocked && (
                <p className={s.meta}>达到 Lv.{sk.unlockLevel} 形态后解锁</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
