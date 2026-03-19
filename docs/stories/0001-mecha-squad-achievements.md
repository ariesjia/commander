# 机甲小队成就系统

> 概述：基于 `docs/MECHA_SQUAD_ACHIEVEMENTS.md` 设计，构建机甲小队成就系统。学生收集指定组合的**全部**机甲（领养）后解锁对应成就，在学生端机甲库展示已解锁/未解锁成就及联合技信息。

---

## 1. 用户故事

**作为** 学生  
**我想要** 在机甲库中看到自己解锁的机甲小队成就（如「突击小队」「铁壁防线」等）  
**以便** 获得收集与组合的成就感，了解机甲之间的协同关系与联合技

---

## 2. 验收标准（Acceptance Criteria）

- [ ] 成就配置：12 个机甲小队成就按 `MECHA_SQUAD_ACHIEVEMENTS.md` 定义，包含 slug、name、description、comboSkill、comboSkillDescription、mechaSlugs
- [ ] 解锁判定：学生 `studentMechas` 中的 `mechaSlug` 包含某成就 `mechaSlugs` 的**全部**即解锁
- [ ] 学生端展示：机甲库页面展示成就列表，已解锁与未解锁区分展示（含联合技名称与描述）
- [ ] 数据来源：家长端 dashboard、学生端 profile 返回 `squadAchievements`，或通过独立 API 获取
- [ ] 成就 1～4 使用已入 seed 机甲可立即生效；成就 5～12 依赖设计阶段机甲，待其加入 seed 后生效

---

## 3. 技术方案

### 3.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `prisma/seed-data/mecha-squads.ts` | 新增 | 成就配置：12 个 MechaSquadConfig，与 MECHA_SQUAD_ACHIEVEMENTS.md 一致 |
| `src/lib/mecha-squads.ts` | 新增 | 解锁判定逻辑：`getUnlockedSquadSlugs(ownedSlugs: string[])`，返回已解锁成就 slug 列表 |
| `src/app/api/student/profile/route.ts` | 修改 | 响应中增加 `squadAchievements`：所有成就 + 每项 `unlocked` 状态 |
| `src/app/api/parent/dashboard/route.ts` | 修改 | 同上，增加 `squadAchievements` |
| `src/contexts/DataContext.tsx` | 修改 | 增加 `squadAchievements` 状态及类型，从 profile/dashboard 拉取 |
| `src/types/index.ts` | 修改 | 增加 `MechaSquadAchievement`、`SquadAchievementItem` 类型 |
| `src/components/mecha/SquadAchievements.tsx` | 新增 | 成就展示组件：列表/卡片，已解锁高亮，展示联合技 |
| `src/components/mecha/MechaLibraryPage.tsx` | 修改 | 引入 SquadAchievements，在机甲库页面底部或合适位置展示 |

### 3.2 数据库设计（Database Design）

**无需新增数据库模型**。成就配置为静态数据，解锁状态由 `studentMechas` 实时计算。

- 配置存放在 `prisma/seed-data/mecha-squads.ts`（与 mechas.ts 同级，供 seed 或直接 import 使用）
- 若后续需要「解锁时间」「成就进度」等，可考虑新增 `StudentSquadAchievement` 模型，本 story 不涉及

### 3.3 前端设计（Frontend Design）

- **涉及页面**：`app/student/mecha`（机甲库）
- **涉及组件**：
  - 新增 `SquadAchievements`：成就列表，每项展示名称、描述、联合技、联合技描述、解锁状态
  - 复用 `MechaLibraryPage` 布局，在其内增加成就区块
- **交互流程**：
  1. 学生进入机甲库，DataContext 已有 `squadAchievements`（来自 profile/dashboard）
  2. 展示成就列表，已解锁项高亮/带标识，未解锁项灰显或显示「收集 X、Y 解锁」
  3. 可展开查看联合技描述
- **视觉与响应式**：
  - 与学生端科技卡通风格一致，使用 `s-primary`、`s-card` 等设计 token
  - 移动端优先，成就卡片可折叠或网格展示

---

## 4. 依赖与风险

- **依赖**：
  - `docs/MECHA_SQUAD_ACHIEVEMENTS.md` 成就均使用 `prisma/seed-data/mechas.ts` 中已有机甲，可直接生效
  - 文档中 mechaSlugs 与 seed 的 slug 需一致

---

## 5. 优先级（可选）

- [ ] P0 必须
- [x] P1 重要
- [ ] P2 可选

---

## 附录：成就配置示例（mecha-squads.ts）

```ts
export interface MechaSquadConfig {
  slug: string;
  name: string;
  description: string;
  comboSkill: string;
  comboSkillDescription: string;
  mechaSlugs: string[];
  sortOrder: number;
}

export const MECHA_SQUAD_ACHIEVEMENTS: MechaSquadConfig[] = [
  {
    slug: "assault-team",
    name: "突击小队",
    description: "玄甲与利刃组成的突击双人组，冲锋撕阵、突袭斩首，破阵与切入一气呵成",
    comboSkill: "破阵斩",
    comboSkillDescription: "玄甲率先冲锋撕开敌阵，利刃紧随其后切入弱点，破阵与斩首无缝衔接，敌阵在二人合击下瞬间瓦解",
    mechaSlugs: ["xuanjia", "razor"],
    sortOrder: 0,
  },
  // ... 共 12 个，见 MECHA_SQUAD_ACHIEVEMENTS.md
];
```
