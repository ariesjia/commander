---
name: add-mecha
description: Guides adding a new mecha to the MotiMech system. Requires name, slug, intro from user; validates images in public/mecha/<slug>/; references docs/*-详细设计.md to create complete design; collects info, confirms with user, then executes. Use when the user wants to add a new mecha, 新增机甲, or add robot/机甲 to the system.
---

# 新增机甲

向 MotiMech 系统添加新机甲。**必须先参考 `docs/` 中同类型机甲的详细设计**，完善新机甲的完整设计，再收集信息、校验资源、经用户确认后执行。

## 工作流程

### Phase 0: 参考现有设计（必做）

**在收集/确认新机甲信息前**，必须：

1. 读取 `docs/README.md` 了解文档结构
2. 根据新机甲类型，读取 **1～2 份同类型** 的 `docs/*-详细设计.md` 作为参考：
   - 人形机甲 → 参考 利刃、玄甲、星盾 等
   - 载具机甲 → 参考 空境、沧龙、方舟 等
   - 仿生机甲 → 参考 猎犬、缚网、地渊、俯冲 等
3. 按参考文档的**十段结构**，为新机甲起草完整详细设计（见 Phase 4 步骤 7）

**参考文档路径**：`docs/<中文名>-<English>-详细设计.md`，如 `docs/缚网-Reticle-详细设计.md`

### Phase 1: 收集信息

**必填**（用户需提供）：
- `name`：机甲中文名称（如「利刃」）
- `slug`：英文标识，小写+连字符（如 `razor`、`star-shield`）
- `intro`：完整介绍文案（用于详情页）

**人物设定**（用于 `docs/MECHA_CHARACTERS.md`，建议提供）：
- `定位`：机甲类型定位（如「极速突袭型人形机甲」）
- `特点`：擅长能力与核心特性
- `职责`：战场职责（如「快速突袭、弱点击破、敌后干扰」）

**可选**（可后续补充）：
- `description`：简短描述，缺省时从 intro 或定位提取
- 各等级自定义名称（level 4、5、6 可不同于「进阶」「突破」「升华」）

**信息不足时**：明确列出缺失项，向用户提问；可建议用户参考 `docs/*-详细设计.md` 中同类型机甲的设计思路，待补全后再继续。

### Phase 2: 校验图片

根据 slug 查找 `public/mecha/<slug>/` 目录下的图片：

```bash
ls public/mecha/<slug>/
# 或使用 Glob: public/mecha/<slug>/*.png
```

**校验规则**：
- 标准配置需要 8 张：`level-0.png` ～ `level-7.png`
- **若图片少于 3 张**：提醒用户「图片数量不足，请先在 `public/mecha/<slug>/` 放入至少 8 张等级图片（level-0.png ～ level-7.png）」
- 若缺少部分 level：列出缺失的 level-N.png，询问用户是否补全或暂用占位

### Phase 3: 整理并确认

整理为如下格式，**展示给用户确认**：

```markdown
## 新增机甲信息确认

| 字段 | 值 |
|------|-----|
| name | xxx |
| slug | xxx |
| description | xxx |
| intro | xxx |
| sortOrder | N（当前最大+1） |
| 定位 | xxx（人物设定） |
| 特点 | xxx |
| 职责 | xxx |
| 图片 | 已找到 level-0～7（或列出缺失） |
| 详细设计 | 将创建 docs/<name>-<English>-详细设计.md（参考同类型机甲） |
| doc.md | 将创建 public/mecha/<slug>/doc.md |

请确认以上信息无误后，我将执行添加。
```

**必须等用户明确确认**（如「确认」「可以」「执行」）后再进入 Phase 4。

### Phase 4: 执行

1. 编辑 `prisma/seed-data/mecha-skills.ts`，在 `MECHA_SKILLS_BY_SLUG` 中为新 `slug` 增加 3 条里程碑技能（`unlockLevel` 2/5/7，`kind` 为 `MechaSkillKind`）
2. 编辑 `prisma/seed-data/mechas.ts`，在 `MECHA_SEED_DATA` 数组末尾追加新机甲配置（含 `skills: MECHA_SKILLS_BY_SLUG["<slug>"]!`）
3. `sortOrder` = 现有最大 sortOrder + 1
4. `description` 缺省时用 intro 首句或定位描述
5. levels 使用标准阈值：0, 20, 50, 80, 120, 160, 200, 250
6. 等级文案可参考现有机甲风格，结合 intro 生成
7. 编辑 `docs/MECHA_CHARACTERS.md`，在文档末尾追加新机甲人物设定（格式参考现有条目，英文名用 slug 转 Title Case，如 `star-shield` → Star Shield）
8. **创建详细设计文档** `docs/<name>-<English>-详细设计.md`，**必须参考同类型机甲的 `docs/*-详细设计.md`**，按以下十段结构撰写：

| 章节 | 内容 |
|------|------|
| 一、基础设定 | 中文名、英文名、类型、定位、设计灵感 |
| 二、外观设计 | 整体形态、配色方案、结构细节、材质质感 |
| 三、核心能力 | 4 项核心能力说明 |
| 四、专属装备 | 装备名与功能列表 |
| 五、职责与战术 | 战场职责、战术风格、适用地形 |
| 六、等级进化体系 | 0～7 级称号与进化要点 |
| 七、人物特质 | 性格、战斗风格（可选） |
| 八、与其他机甲的协同 | 协同机甲与协同方式表格 |
| 九、简介文案 | 简短描述、完整介绍（用于系统） |
| 十、设计参考要点 | 供绘图/建模的要点 |

**参考模板**：`docs/缚网-Reticle-详细设计.md`、`docs/猎犬-Hound-详细设计.md` 等
9. 创建 `public/mecha/<slug>/doc.md`，格式参考 `public/mecha/dive/doc.md`（简明版：类型、特点、职责、配色、专属装备、简介、等级称号）
10. 更新 `docs/README.md`，在「四、机甲详细设计」对应分类（人形/载具/仿生）下追加新机甲详细设计条目
11. 执行 `pnpm db:seed` 或 `npx prisma db seed`

## 配置模板

```ts
{
  slug: "<slug>",
  name: "<name>",
  description: "<description>",
  intro: "<intro>",
  sortOrder: <N>,
  levels: [
    { level: 0, name: "初识", threshold: 0, imageUrl: "/mecha/<slug>/level-0.png", description: "..." },
    { level: 1, name: "觉醒", threshold: 20, imageUrl: "/mecha/<slug>/level-1.png", description: "..." },
    { level: 2, name: "成型", threshold: 50, imageUrl: "/mecha/<slug>/level-2.png", description: "..." },
    { level: 3, name: "强化", threshold: 100, imageUrl: "/mecha/<slug>/level-3.png", description: "..." },
    { level: 4, name: "进阶", threshold: 200, imageUrl: "/mecha/<slug>/level-4.png", description: "..." },
    { level: 5, name: "突破", threshold: 350, imageUrl: "/mecha/<slug>/level-5.png", description: "..." },
    { level: 6, name: "升华", threshold: 500, imageUrl: "/mecha/<slug>/level-6.png", description: "..." },
    { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/<slug>/level-7.png", description: "..." },
  ],
  skills: MECHA_SKILLS_BY_SLUG["<slug>"]!,
},
```

## 参考

- 文档目录：`docs/README.md`（了解 docs 结构）
- 种子数据：`prisma/seed-data/mechas.ts`、`prisma/seed-data/mecha-skills.ts`
- 人物设定：`docs/MECHA_CHARACTERS.md`（新增机甲时需同步追加）
- 详细设计模板：`docs/缚网-Reticle-详细设计.md`、`docs/猎犬-Hound-详细设计.md` 等（**新增机甲时必须参考同类型，并创建完整详细设计**）
- doc.md 模板：`public/mecha/dive/doc.md`、`public/mecha/hound/doc.md`
- 新增指南：`docs/ADD_MECHA.md`
