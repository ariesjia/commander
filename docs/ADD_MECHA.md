# 新增机甲指南

本文档说明如何向系统中添加一台新机甲。机甲种子数据存放在 `prisma/seed-data/mechas.ts`，seed 会读取并同步到数据库。

## 前置要求

- 8 张机甲等级图片（PNG 格式）
- 机甲的命名、简介及各级描述文案

## 步骤

### 1. 准备图片资源

在 `public/mecha/` 下创建以机甲 slug 命名的目录，放入 8 张等级图片：

```
public/mecha/<slug>/
├── level-0.png   # 量产型
├── level-1.png   # 改良型
├── level-2.png   # 特装型
├── level-3.png   # 强化型
├── level-4.png   # 进阶型（如装甲型、光铠型）
├── level-5.png   # 突破型（如火力型、雷霆型）
├── level-6.png   # 完全型（如开眼型、锋芒型）
└── level-7.png   # 完整体
```

**图片规范**：建议尺寸一致，与现有机甲（如 `xuanjia`、`star-shield`、`razor`）保持相近比例。

### 2. 在种子数据中添加机甲

编辑 `prisma/seed-data/mechas.ts`，在 `MECHA_SEED_DATA` 数组中追加一项：

```ts
{
  slug: "my-mecha",           // 英文标识，用于 URL 和数据库，建议小写+连字符
  name: "我的机甲",            // 显示名称
  description: "简短描述",     // 一句话介绍
  intro: "完整介绍文案。它在历练中不断觉醒，解锁更强形态...",  // 详情页展示
  sortOrder: 3,               // 排序，数字越大越靠后
  levels: [
    { level: 0, name: "量产型", threshold: 0, imageUrl: "/mecha/my-mecha/level-0.png", description: "..." },
    { level: 1, name: "改良型", threshold: 20, imageUrl: "/mecha/my-mecha/level-1.png", description: "..." },
    { level: 2, name: "特装型", threshold: 50, imageUrl: "/mecha/my-mecha/level-2.png", description: "..." },
    { level: 3, name: "强化型", threshold: 100, imageUrl: "/mecha/my-mecha/level-3.png", description: "..." },
    { level: 4, name: "装甲型", threshold: 200, imageUrl: "/mecha/my-mecha/level-4.png", description: "..." },
    { level: 5, name: "火力型", threshold: 350, imageUrl: "/mecha/my-mecha/level-5.png", description: "..." },
    { level: 6, name: "完全型", threshold: 500, imageUrl: "/mecha/my-mecha/level-6.png", description: "..." },
    { level: 7, name: "完整体", threshold: 800, imageUrl: "/mecha/my-mecha/level-7.png", description: "..." },
  ],
},
```

**字段说明**：

| 字段 | 说明 |
|------|------|
| `slug` | 唯一标识，建议小写英文，多词用连字符（如 `star-shield`） |
| `name` | 机甲中文名称 |
| `description` | 简短描述，用于列表等场景 |
| `intro` | 完整介绍，用于机甲详情页 |
| `sortOrder` | 排序序号，0 最前 |
| `levels` | 8 个等级配置 |

**等级字段**：

| 字段 | 说明 |
|------|------|
| `level` | 等级序号，0～7 |
| `name` | 等级名称，统一用「xxx型」格式，不含机甲本名。0-3 用「量产型」「改良型」「特装型」「强化型」，4-6 参考定位自定义（如「装甲型」「光铠型」「破甲型」） |
| `threshold` | 升级所需积分，建议与现有机甲一致：0, 20, 50, 100, 200, 350, 500, 800 |
| `imageUrl` | 图片路径，以 `/mecha/<slug>/level-N.png` 形式 |
| `description` | 该等级的文案描述 |

### 3. 添加人物设定

编辑 `docs/MECHA_CHARACTERS.md`，在文档末尾追加新机甲的人物设定（定位、特点、职责），格式参考现有条目。

### 4. 执行数据库 seed

```bash
npx prisma db seed
```

或使用 npm script：

```bash
npm run db:seed
```

seed 会检测该机甲是否已存在且配置完整：若已存在则跳过，若存在但配置不完整则删除后重建。

## 参考示例

- **玄甲** (xuanjia)：重装进化路线
- **星盾** (star-shield)：守护/星光路线
- **利刃** (razor)：极速/斩击路线

可直接参考 `prisma/seed-data/mechas.ts` 中现有配置的写法。
