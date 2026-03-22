/**
 * 机甲领养 - 前端辅助逻辑
 * 机甲配置已迁移至后端，通过 /api/mechas 获取
 * 本文件仅保留类型定义和向后兼容的常量（玄甲 slug）
 */

export const MECHA_XUANJIA = "xuanjia";

export interface MechaLevel {
  level: number;
  name: string;
  threshold: number;
  imageUrl: string;
  description: string;
}

/** 与 API `MechaSkillDto` / Prisma `MechaSkillKind` 对齐 */
export interface MechaSkill {
  unlockLevel: number;
  kind: string;
  slug: string;
  name: string;
  description: string;
}

export interface MechaDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  intro: string | null;
  levels: MechaLevel[];
  skills: MechaSkill[];
}
