---
name: add-mecha
description: Guides adding a new mecha to the MotiMech system. Requires name, slug, intro from user; validates images in public/mecha/<slug>/; collects info, confirms with user, then executes. Use when the user wants to add a new mecha, 新增机甲, or add robot/机甲 to the system.
---

# 新增机甲

向 MotiMech 系统添加新机甲。先收集信息、校验资源、经用户确认后再执行。

## 工作流程

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

**信息不足时**：明确列出缺失项，向用户提问，待补全后再继续。

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

请确认以上信息无误后，我将执行添加。
```

**必须等用户明确确认**（如「确认」「可以」「执行」）后再进入 Phase 4。

### Phase 4: 执行

1. 编辑 `prisma/seed-data/mechas.ts`，在 `MECHA_SEED_DATA` 数组末尾追加新机甲配置
2. `sortOrder` = 现有最大 sortOrder + 1
3. `description` 缺省时用 intro 首句或定位描述
4. levels 使用标准阈值：0, 20, 50, 80, 120, 160,200,250
5. 等级文案可参考现有机甲风格，结合 intro 生成
6. 编辑 `docs/MECHA_CHARACTERS.md`，在文档末尾追加新机甲人物设定（格式参考现有条目，英文名用 slug 转 Title Case，如 `star-shield` → Star Shield）：

```markdown
---

## <name> (<English>)

**定位**：<定位>

**特点**：<特点>

**职责**：<职责>
```

7. 执行 `pnpm db:seed` 或 `npx prisma db seed`

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
},
```

## 参考

- 种子数据：`prisma/seed-data/mechas.ts`
- 人物设定：`docs/MECHA_CHARACTERS.md`（新增机甲时需同步追加）
- 详细文档：`docs/ADD_MECHA.md`
