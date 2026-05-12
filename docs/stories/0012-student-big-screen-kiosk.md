# 学生端「大屏专注模式」展示页

> 概述：为学生提供一条独立路由的大屏/电视友好界面——左侧突出「当前累计得分」及与昨日（自然日）对比的增减；右侧展示当前主机甲立绘/机体，全屏自适应不同宽高比与字号，隐藏底部主导航以减少干扰。

---

## 1. 用户故事

**作为** 学生（或由家长代开在客厅电视/教室大屏上）  
**我想要** 在宽屏上看到大号积分与我的主机甲，并能一眼看出「今天相对昨天」是进步还是退步  
**以便** 在家庭或班级场景中强化成就感与目标感，减少小屏上的次要信息干扰  

**与 PRD 关联**：PRD v3「产品边界」中「学生独立设备访问（后续考虑）」——本 story 以 **同账号学生模式下的专用展示路由** 落地首版，不引入新角色体系；视觉延续学生端「科技卡通」与 `theme-student` 体系（见 `docs/PRD-机甲指挥官-学生游戏化激励系统.md` §12、§14）。

---

## 2. 验收标准（Acceptance Criteria）

- [ ] 学生登录后可通过固定路径（建议 `/student/big-screen`）进入大屏页；未登录访问应被重定向到登录（与现有学生路由一致）。
- [ ] 布局在 **横屏宽屏**（如 16:9、21:9）下为 **左右分栏**：左侧为得分区，右侧为机甲展示区；在 **竖屏 / 窄屏** 下自动切换为 **上下堆叠**（先得分后机甲，或产品定序），关键数字与机体不被裁切。
- [ ] 左侧主数字展示 **当前累计积分** `Student.totalPoints`（经 `toDisplay(..., baseScore)` 与家长端「累计积分」口径一致）；辅以家长 `baseScore` 配置。
- [ ] 左侧展示 **与「昨日」对比的增减**，口径明确为：在 **Asia/Shanghai 自然日** 下，对 **影响累计分的积分流水** 求和得到「昨日净变化」「今日截至目前净变化」，并展示 **今日净变化 − 昨日净变化**（或等价的「较昨日」一句文案 + 绿/红箭头）；若昨日无流水则显示中性文案（如「昨日无积分变化」）。
- [ ] 影响累计分的流水类型与 `Student.totalPoints` 写入路径一致：`TASK_REWARD`、`TASK_REWARD_UNDO`、`TASK_PENALTY`、`TASK_PENALTY_UNDO`、`BATTLE_REWARD`；**不包含** `EXCHANGE_COST` / `EXCHANGE_REFUND`（二者主要影响可用/冻结积分，见 `prisma/schema.prisma` 与兑换相关 API）。
- [ ] 右侧展示 **当前主机甲**（`Student.primaryMecha` / `adoptedMechaIds[0]` 与 `src/app/student/page.tsx` 一致）：有 slug 时用 `XuanjiaViewer`（或等价立绘），无领养时用 `MechaViewer` 的阶段机体；尺寸随容器 `object-contain`，最小字号/触控区符合 PRD 响应式可读性。
- [ ] 本页 **不展示** 底部 `StudentNav`（避免电视误触与信息噪音）；从本页返回普通学生首页需有明确入口（如「返回」或点击角落）。
- [ ] 数据可通过 **轮询或 SWR 轻量刷新**（如 30–60s）或手动刷新，避免大屏长期静止与后台积分不同步（具体间隔实现阶段再定）。

---

## 3. 技术方案

### 3.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `src/app/student/big-screen/page.tsx` | 新增 | 大屏 UI：响应式左右/上下布局、`toDisplay`、对比文案、机甲区复用 `XuanjiaViewer` / `MechaViewer` |
| `src/app/student/big-screen/layout.tsx` | 新增（可选） | 若需单独 metadata / 主题变量，可放此；否则可省略由 page 承担 |
| `src/app/student/layout.tsx` | 修改 | 当 `pathname` 为 `/student/big-screen`（或前缀匹配）时 **不渲染** `StudentNav`，并调整 `main` 底部 padding（避免为大屏预留 Tab 安全区） |
| `src/app/api/student/big-screen/route.ts` | 新增 | `GET`：`requireStudent` 后返回聚合字段：`totalPoints`、`baseScore`、`yesterdayNet`、`todayNet`、`deltaVsYesterday`、`primarySlug`、`primaryMechaPoints`、`nickname` 等；内部复用 `getTodayStr` / `toChinaDateStr`（`src/lib/utils.ts`）与 `pointsToNumber` |
| `src/lib/student-points-daily-net.ts`（名称可调整） | 新增 | 封装按学生 ID + 上海日历日聚合 `PointsLog` 的查询（可两次 `aggregate` 或单次 raw query），类型集合为上述枚举子集 |
| `src/contexts/DataContext.tsx` | 可选修改 | 若希望与首页共用拉取逻辑，可将大屏所需字段并入 `profile`；否则大屏页独立 `fetch` 即可，避免拖慢全局首屏 |
| `src/components/student/StudentNav.tsx` 或学生首页 | 可选修改 | 增加「大屏模式」入口（如图标或设置内链接），避免用户只能靠手输 URL |

### 3.2 数据库设计（Database Design）

**首版无需新表**：对比数据由 `PointsLog` 按 `createdAt` 落库时间与 `toChinaDateStr(createdAt)` 归类计算即可。

**索引与性能（可选优化）**：若学生流水极大，可在后续 migration 增加合成索引，例如 `@@index([studentId, createdAt])`（当前 `PointsLog` 仅有 `@@index([studentId])`，见 `prisma/schema.prisma`）。实现前用 explain 评估；一般家庭场景可先不加。

**若未来改为「昨日此时刻累计分差」**：需日终或定时写入 `StudentDailyTotalSnapshot` 一类表，本 story 不纳入。

### 3.3 前端设计（Frontend Design）

- **涉及页面**：`src/app/student/big-screen`（学生模式子路由，复用现有 `student-bg` / `theme-student`）。
- **涉及组件**：复用 `MechaViewer`、`XuanjiaViewer`（`src/components/mecha/`）；数字展示复用 `toDisplay`（`src/lib/score-display.ts`）；文案如需拼音可后续接 `TextWithPinyin`（与 `showPinyin` 一致时可读 `profile` 或父级 `Parent.showPinyin`）。
- **交互流程**：登录 → 学生模式 →（可选入口）→ 大屏页；大屏仅读展示 + 返回；无任务确认等写操作。
- **视觉与响应式**：
  - 断点参考 PRD §14：大屏使用 `min-width` 切换 `flex-row` / `flex-col`；字号用 `clamp()` 或 `text-4xl`→`text-7xl` 阶梯，保证 3m 外可读（具体以设计微调）。
  - 与首页 `src/app/student/page.tsx` 机甲区域保持同一套机体数据源，避免「大屏与手机两台机」展示不一致（同一 session 以刷新为准）。

---

## 4. 依赖与风险

- **依赖**：现有学生鉴权、`/api/student/profile` 同源数据模型；`utils` 中国时区自然日与任务/战斗逻辑一致。
- **风险**：
  - **「较昨日」语义**：采用「流水净变化对比」而非「累计分绝对值差」，需在 UI 用小字说明，避免家长误解。
  - **时区**：所有日期边界必须与 `getTodayStr` / `toChinaDateStr` 一致，避免与任务日切不同步。
  - **撤销与惩罚**：流水含负数，`aggregate` 使用 `sum` 即可。
  - **大屏长期常亮**：浏览器省电/熄屏与烧屏不在 Web 范围内，可在文档中提示家长使用设备自带设置。

---

## 5. 优先级（可选）

- [ ] P1 重要（家庭激励场景延伸，实现成本可控）
- [ ] P0 必须
- [ ] P2 可选
