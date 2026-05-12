---
name: add-item
description: Adds or updates inventory item catalog entries from `public/item/*.png`, syncing docs and Prisma seeds. Covers reading `docs/data/item-catalog.md`, visual review of sprites, authoring slug/name/description, updating `prisma/seed-data/items.ts`, running `npm run db:seed`. Use when adding items, 新增道具图鉴, 更新道具种子, item catalog seed, `ITEM_SEED_DATA`.
---

# 新增道具图鉴条目

面向 Story `0003-student-item-inventory`：**文件名**映射 `slug`、`name`、`description`、`imageUrl`（`/item/xxxx.png`）、`sortOrder`。**权威文档**： [docs/data/item-catalog.md](../../../docs/data/item-catalog.md)。

## 工作流程

### Phase 1: 收集范围

与用户确认：
- **文件编号**：如 `0020.png`、`0017.png`～`0032.png`。
- **是否跳过缺失编号**：当前约定无 `0002.png` 则不在种子中插入 `sortOrder: 2`。

### Phase 2: 读现有规范

1. 打开 [docs/data/item-catalog.md](../../../docs/data/item-catalog.md) 一览表，沿用表格列与语气（介绍**朗读友好**，偏机甲科幻、装备/传感/能源风格）。
2. 打开 [prisma/seed-data/items.ts](../../../prisma/seed-data/items.ts)，确认 `ItemSeedRow`：`slug`、`name`、`description`、`imageUrl`、`kind`、`sortOrder`。图鉴条目默认 **`kind: "DISPLAY"`**，`sortOrder` **等于文件名四位数字去除前导零的数值**。

### Phase 3: 逐图编写

对每张 PNG：
1. **阅读图片**（`public/item/<id>.png`），抓住外观特征与用途猜想。
2. 填写 **`slug`**：小写英文字母与连字符，语义唯一；避免与表中已有 slug 冲突。
3. 填写 **`name`**：简明中文道具名。
4. 填写 **`description`**：**约 2 句**，信息量高于一行简介；可描写结构、指示灯/能量特征、战场用途与使用注意。
5. **`imageUrl`**：`/item/<与文件同名>.png`

### Phase 4: 同步两处数据

1. 在 **item-catalog.md** 一览表追加或修改行。
2. 更新文内「种子数据片段」后的说明（如涉及编号范围）。
3. 按需更新文末 **分类备注**（武器 / 传感 / 能源 / 装备后勤 / 工程载具）。
4. 在 **`ITEM_SEED_DATA`** 中追加或修改对应对象，字段与表格一致。

### Phase 5: 验证

```bash
npm run db:seed
```

若类型或 ESLint 报错，修复 [prisma/seed-data/items.ts](../../../prisma/seed-data/items.ts) 等问题后重跑。

### Phase 6: checklist（自检）

```
- [ ] 每个新文件仅在表与 ITEM_SEED_DATA 各出现一次且一致
- [ ] slug 全小写、连字符，无重复
- [ ] sortOrder 与文件名编号一致（跳过编号则种子无该项）
- [ ] description 无多余英文占位词（除专用缩写）
```

## 配置模板

```ts
{
  slug: "<slug-kebab-case>",
  name: "<中文名>",
  description: "<两旬左右朗读友好说明>",
  imageUrl: "/item/0019.png",
  kind: "DISPLAY",
  sortOrder: 19,
}
```
