# 学生端道具库（定义 + 库存展示）

> 概述：本 story **仅落地「道具库」**：道具具备**名称、介绍、图片**；学生在端上能查看**自己拥有的道具及数量**（堆叠）；点击道具后以**类似机甲库**的方式从**左侧滑出抽屉**展示详情，并提供**朗读**。**交互壳与朗读逻辑要求抽取复用**（见 §4.4）。**不包含**盲盒碎片合成、盲盒开启、随机抽机甲等业务——该方向见 **§5 未来扩展（设计预留）**，由后续独立 story 实现。

**关联**：学生端 `src/app/student/items/page.tsx`；战斗奖励中的 `item` 扩展位见 `docs/stories/0002-student-battle-system.md`（本 story 可不实现发放，仅预留 slug 与表结构兼容）。

---

## 1. 用户故事

**作为** 学生  
**我想要** 在道具库里浏览道具的**名称、配图、文字介绍**，并看到**我当前持有数量**；点击道具后像机甲库一样**从左侧滑出抽屉**查看详情，并支持**朗读**（与机甲库体验一致）  
**以便** 清楚自己拥有哪些道具、在不方便阅读时也能听介绍

**作为家长 / 产品**  
**我想要** 道具定义可维护（种子或后续管理），库存与学生账号绑定  
**以便** 后续任务、战斗、活动发放道具时能直接接入同一套数据模型

---

## 2. 业务规则（本 story 范围内）

### 2.1 道具定义（全局）

| 字段 | 说明 |
|------|------|
| 唯一标识 | `slug`（稳定键，供发放与 API 引用） |
| 展示 | **名称**、**介绍**（长文案）、**图片 URL** |
| 可选 | `kind` 分类（如展示型 / 材料 / 消耗品），便于未来扩展；**本 story 仅用于展示与筛选，不触发任何「使用」逻辑 |
| 上下线 | `isActive`、`sortOrder` |

### 2.2 学生库存

- 每个学生、每种道具一条（或 `quantity` 堆叠）；**数量为 0** 的可在列表隐藏或单独「未获得」展示——产品二选一，文档建议**默认只展示 quantity > 0**，空库存时整页空态。
- **本 story 不提供**发放、消耗、合成、开盒等写接口（除种子为联调写入测试数据外）。

### 2.3 种子与联调

- 可种子若干条示例 `Item` + 为测试学生写入少量 `StudentItem`，便于 UI 联调。

### 2.4 交互与朗读（与机甲库对齐）

| 要求 | 说明 |
|------|------|
| **点击条目** | 打开**侧滑抽屉**（自屏幕**左侧**滑入，右侧蒙层点击关闭），**交互与视觉层级**与机甲库 `MechaDrawer` 一致：顶区关闭、中部可滚动内容、底区主要操作 |
| **抽屉内容** | 道具**大图**、**名称**、**持有数量**、**完整介绍文案**；布局节奏可参考机甲库（图 → 标题 → 正文） |
| **朗读** | 浏览器支持 `speechSynthesis` 时展示「朗读」按钮；朗读文本建议为**名称 + 介绍**（可含「持有 x 件」），与机甲库「朗读故事」同类的 **TTS 参数**（如 `zh-CN`、选中文 voice、结束/报错时复位状态） |
| **拼音** | 若全局 `showPinyin` 打开，名称与介绍使用与机甲库相同的 **`TextWithPinyin`** 展示（与 `DataContext` 一致） |

---

## 3. 验收标准（Acceptance Criteria）

- [ ] 道具**定义**表/种子至少包含：`slug`、**名称**、**介绍**、**图片 URL**；可选 `kind`、`isActive`、`sortOrder`
- [ ] 学生**库存**表可按学生查询；列表接口返回「道具定义 + 当前数量」
- [ ] 学生端 `/student/items`：**列表**（卡片：图、名、数量角标）；点击后打开**左侧抽屉**，展示大图、名称、数量、完整介绍（**交互对标机甲库抽屉**）
- [ ] 抽屉内提供**朗读**能力：不支持 TTS 时隐藏或禁用按钮；支持时与机甲库一致可「停止朗读」
- [ ] **加载中 / 空状态** 文案清晰
- [ ] `GET /api/student/items`（或等价）需登录学生身份，仅返回当前学生数据
- [ ] **组件层面**：已**抽取或复用**共用抽屉框架与朗读逻辑（见 §4.4），避免复制粘贴整段 `MechaDrawer`
- [ ] **不包含**：碎片合成、盲盒开启、抽机甲、战斗掉落道具（后续 story）

---

## 4. 技术方案

### 4.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `prisma/schema.prisma` | 修改 | 新增 `Item`、`StudentItem`；`ItemKind` enum（可选，便于与未来盲盒 story 衔接） |
| `prisma/seed.ts` 或独立 seed | 修改 | 示例道具 + 可选测试库存 |
| `src/app/api/student/items/route.ts` | 新增 | `GET`：当前学生道具列表（含定义与 quantity） |
| `src/app/api/student/profile/route.ts` | 修改 | 可选：挂载 `itemsCount` 等供首页角标 |
| `src/contexts/DataContext.tsx` | 修改 | 可选：拉取库存摘要 |
| `src/app/student/items/page.tsx` | 修改 | 接真实 API；列表 + 选中态打开抽屉 |
| `src/components/items/ItemInventoryPage.tsx`（或同级） | 新增 | `ItemCard`、组合 `ItemDrawer` 与列表 |
| `src/components/items/ItemDrawer.tsx` | 新增 | 道具详情抽屉（内容区）；**壳子**优先复用下栏组件 |
| `src/components/student/StudentSideDrawer.tsx`（命名可调整） | **新增（抽取）** | 从 `MechaLibraryPage` 的 `MechaDrawer` 抽出：**蒙层 + 左侧滑入面板 + 安全区 + 关闭钮 + 滚动区 + 底栏插槽**，通过 `children` / render props 注入业务内容 |
| `src/hooks/useReadAloud.ts` 或 `src/lib/read-aloud.ts` | **新增（抽取）** | 封装 `speechSynthesis` 检测、选中文 voice、`speak(text)` / `cancel()`、朗读中状态；机甲库与道具库共用 |
| `src/lib/item-speech.ts` | 新增 | `buildItemReadAloudText({ name, description, quantity })` 纯函数 |
| `src/components/mecha/MechaLibraryPage.tsx` | 修改（可选、推荐） | 将 `MechaDrawer` 改为使用 `StudentSideDrawer` + `useReadAloud`，**行为不变**，减少重复 |

**本 story 不新增**：`merge-fragment`、`open-blind-box`、`blind-box.ts`、`ItemUseLog`（留待盲盒 story）。

### 4.4 组件复用策略（抽取顺序建议）

1. **`StudentSideDrawer`**（或 `StudentDrawerLayout`）  
   - 入参：`open`（或由父级条件渲染）、`onClose`、`title`（可选）、**`footer`**（ReactNode，固定底栏，如朗读按钮）、**`children`**（可滚动主体）。  
   - 样式与动画：复刻 `MechaDrawer` 中 `motion.div` 蒙层 + 左侧面板（`fixed left-0 … top-[env(safe-area-inset-top)] bottom-0`、`rounded-r-2xl`、`border-r border-s-primary/20` 等），保证**道具库与机甲库切换时体验统一**。

2. **`useReadAloud`（或 `readAloudSpeak` 工具）**  
   - 从 `MechaDrawer` 的 `handleSpeak` / `useEffect` 语音检测逻辑抽出；机甲库改为调用 hook 后，道具抽屉传入 `buildItemReadAloudText(...)` 生成的字符串即可。

3. **`ItemDrawer`**  
   - 内部：`StudentSideDrawer` + 图/文 + `TextWithPinyin` + 底栏「朗读」按钮（调用 `useReadAloud`）。  
   - **不**包含机甲专属「进化历程」按钮；若底栏仅一项，可只渲染朗读或预留 `footer` 扩展位。

4. **机甲库重构**  
   - 若工期紧：可先**只在新页面用抽取件**，机甲库仍在后续迭代替换；若可接受小范围重构，建议**同时替换** `MechaDrawer` 壳与朗读 hook，避免两套并行维护。

**参考实现位置**：`src/components/mecha/MechaLibraryPage.tsx` 内 `MechaDrawer`（约 193–388 行）：`createPortal`、`framer-motion`、底部 `Volume2` / `Square` 朗读区。

### 4.2 数据库设计（Database Design）

**原则**：道具定义全局；库存 `studentId` + `itemId` 唯一，数量堆叠。

```prisma
enum ItemKind {
  DISPLAY    // 仅展示/纪念（本 story 主要使用）
  MATERIAL   // 材料（预留：如未来盲盒碎片）
  CONSUMABLE // 消耗品（预留：如未来机甲盲盒）
}

model Item {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String   @db.Text
  imageUrl    String
  kind        ItemKind @default(DISPLAY)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  studentItems StudentItem[]
}

model StudentItem {
  id        String   @id @default(cuid())
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  itemId    String
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  quantity  Int      @default(0)

  @@unique([studentId, itemId])
  @@index([studentId])
}
```

`Student` 增加：`studentItems StudentItem[]`。

迁移建议：`npx prisma migrate dev --name student_item_inventory`

---

### 4.3 前端设计（Frontend Design）

- **路由**：`/student/items`
- **结构**：
  - 顶栏：标题「道具库」+ 一句说明（如「这里陈列你获得的道具」）
  - **网格/列表**：每项展示缩略图、名称、数量（`quantity > 0`）
  - **详情**：**非**独立路由优先；**点击卡片打开左侧抽屉**（与机甲库一致），抽屉内大图 + 名称 + 数量 + 介绍 + 朗读
- **视觉**：与学生端 `glass-card`、现有道具库入口（品红点缀）协调；抽屉背景与机甲库同系（`#0c1222` 等）；触控目标 ≥ 44px
- **空状态**：无道具时的插画/文案 + 引导完成任务等（可与产品微调）
- **无障碍**：抽屉关闭钮 `aria-label`；朗读按钮在不可用时勿误导（隐藏或 `disabled` + 说明）

---

## 5. 未来扩展（设计预留，非本 story）

以下能力**不在本 story 开发范围内**，但数据模型与分类上已**预留** `MATERIAL` / `CONSUMABLE`，便于后续独立 story 衔接。

### 5.1 盲盒碎片与机甲盲盒（产品设想）

| 概念 | 说明 |
|------|------|
| **盲盒碎片** | 可堆叠材料；**20** 个合成 **1** 个「机甲盲盒」（比例可配置） |
| **机甲盲盒** | 消耗品；开启后从**未拥有机甲**池随机抽取一台，创建 `StudentMecha`（需与首次领养 `adopt` 分流，独立 API） |
| **审计** | 可选 `ItemUseLog` 记录合成/开盒结果 |

### 5.2 后续 story 建议拆分

| 后续 story | 内容 |
|------------|------|
| 盲盒与碎片 | 合成、开盒、卡池与领养逻辑复用、`ItemUseLog`、相关 `POST` API |
| 道具发放 | 战斗 `BattleRewardGrant` 发 item、任务奖励、活动导入与对账 |

### 5.3 参考实现时将用到的代码

- 领养随机池：`src/app/api/student/adopt/route.ts`
- 机甲数据：`Mecha`、`MechaLevel`

---

## 6. 依赖与风险

| 类型 | 说明 |
|------|------|
| **依赖** | 无强依赖机甲业务；图片 URL 需可访问（`public/` 或 CDN） |
| **风险** | 若过早种子「碎片/盲盒」slug，需与后续盲盒 story 约定一致，避免重复迁移 |

---

## 7. 优先级（本 story）

- [ ] **P0**：`Item` + `StudentItem`、`GET` 列表、列表页 + **左侧抽屉详情** + **朗读** + 空态
- [ ] **P0.5**：`StudentSideDrawer` + `useReadAloud`（或等价抽取），并（可选）重构 `MechaDrawer` 复用
- [ ] **P1**：profile 角标、DataContext 摘要、种子数据丰富度

---

## 8. 参考代码位置

- 机甲库抽屉与朗读：`src/components/mecha/MechaLibraryPage.tsx`（`MechaDrawer`）
- 拼音展示：`src/components/ui/TextWithPinyin.tsx`；全局开关：`useData().showPinyin`
- 机甲朗读文案组装：`src/lib/mecha-speech.ts`（道具可对齐新增 `item-speech.ts`）
- 学生道具库占位：`src/app/student/items/page.tsx`
- 学生首页入口：`src/app/student/page.tsx`
- 战斗奖励类型扩展：`src/lib/battle-settings.ts` 中 `BattleRewardGrant`（未来发放用）
