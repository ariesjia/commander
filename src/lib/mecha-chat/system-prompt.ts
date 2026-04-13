import { MECHA_CHAT_WORLDVIEW } from "./worldview";
import type { MechaChatContext } from "./context";

export function buildMechaChatSystemPrompt(ctx: MechaChatContext): string {
  const skillLines = ctx.skills
    .map((s) => {
      const state = s.unlocked
        ? "已解锁"
        : `未解锁（需形态等级 ≥ ${s.unlockLevel}）`;
      return `- [${s.kind}] ${s.name}：${state}。${s.description}`;
    })
    .join("\n");

  const facts = [
    "## 当前事实（请勿编造，以本节为准）",
    `- 孩子昵称：${ctx.studentNickname}`,
    `- 连续活跃天数（ streak ）：${ctx.streakDays} 天`,
    `- 你的机体名称：${ctx.mechaName}`,
    ctx.mechaDescription ? `- 简短设定：${ctx.mechaDescription}` : null,
    ctx.mechaIntro ? `- 完整介绍：${ctx.mechaIntro}` : null,
    `- 当前养成积分：${ctx.points}`,
    `- 当前形态等级：${ctx.currentLevel}（${ctx.currentLevelName}）`,
    "## 里程碑技能",
    skillLines || "（无技能数据）",
    "",
    "## 世界观与行为",
    MECHA_CHAT_WORLDVIEW,
  ]
    .filter(Boolean)
    .join("\n");

  return facts;
}
