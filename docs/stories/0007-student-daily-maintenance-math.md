# 学生端每日机甲维修（一年级口算充能）

> 概述：在学生端增加**每日一次的「机甲维修」小游戏**，用**一年级口算**作为「校准能源线路 / 紧固螺栓 / 平衡核心」等世界观包装，**不出现「考试」「测验」等字眼**。首期题目可来自**固定题池或固定规则**，但代码层必须**抽象出题器（Arithmetic Question Generator）**，便于后续换年级、换难度、接题库或算法出题。**完成维修不发放积分**，仅游戏内反馈（动画/文案）。**家长可在设置中开启或关闭该功能，默认开启**；关闭后学生端不展示入口且相关 API 拒绝游玩。

**关联**：`docs/PRD-机甲指挥官-学生游戏化激励系统.md`（游戏化、家长主导）；学生主页与导航 `src/app/student/`；`Parent` 设置与现有 `showPinyin` 等字段并列。

---

## 1. 用户故事

**作为** 学生  
**我想要** 每天进入「机甲维修」完成一小段口算互动，看到主机甲因「检修完成」而有明确反馈  
**以便** 在 MotiMech 里用有趣的方式练一年级加减口算，而不觉得是额外作业

**作为家长 / 产品**  
**我想要** 在设置中**一键开启或关闭「机甲维修」**（默认开启），并可选查看孩子今日是否已完成维修  
**以便** 按家庭需要关闭口算小游戏，且**不涉及积分**，不与任务积分混淆

---

## 2. 产品与叙事规则（不写进 UI 的「考试」）

### 2.1 世界观包装

| 概念 | 对用户说法（示例） | 避免用语 |
|------|-------------------|----------|
| 一组题 | 「今日维修工单」「能源校准步骤」 | 试卷、测验、考试 |
| 单题 | 「第 N 步检修」「校准读数」 | 第几题 |
| 答错 | 「读数波动，再试一次」「线路未锁紧」 | 错误、扣分（若产品选择无惩罚模式） |
| 完成 | 「今日维修完成」「核心读数已稳定」 | 满分、成绩 |

具体文案与美术由实现时统一走**文案常量 / 配置**，便于迭代。

### 2.2 学段与题面范围（首期）

- **默认**：**一年级口算**——与课标常见范围对齐，例如 **20 以内加减法**（可加配置项：`maxSum`、`allowZero`、`operationSet`）。
- **首期实现**：题目来源可为 **固定题池 JSON / TS 常量** 或 **基于种子确定性生成的简单规则题**；无论哪种，**对外都经由出题器接口**，不在页面散落硬编码算式。

### 2.3 每日频次与进度

- **每学生每自然日**至多完成 **1 次**「当日维修」（与战斗、任务确认等自然日边界**同一时区策略**，建议 **Asia/Shanghai**，与 `0002` 等 story 一致）。
- 未完成可多次进入**同一日工单**（避免误触失败后无法补救）；一旦**成功完成**当日工单，当日不可再玩第二次。

### 2.4 家长开关（默认开启）

- **存储**：在 `Parent`（或与学生一对一场景中等价位置）增加布尔字段，如 **`maintenanceMathEnabled`**，**默认 `true`**（开启维修）。
- **行为**：`false` 时，学生端**隐藏**维修入口（首页/导航不出现）；`GET session` / `POST complete` 返回 **403 或业务码**「功能已关闭」，避免直接链接进入。
- **与积分**：**本 story 不包含**完成维修后的任何加分、不写 `PointsLog`。

---

## 3. 出题器抽象（核心设计）

### 3.1 目标

- **题目与展示分离**：出题器只负责产出「当日需要哪些运算、标准答案、稳定 id」，UI 负责「维修步骤」叙事与输入交互。
- **可替换**：后续可新增 `Grade2Generator`、`CurriculumJsonPoolGenerator` 等，**不改 UI 主流程**（仅配置 `grade` / `generatorKey`）。
- **可测**：纯函数或无副作用模块，便于单元测试（同 seed、同参数 → 同题目列表）。

### 3.2 建议类型设计（实现时以代码为准，此处为契约说明）

```ts
/** 单次运算条目（与叙事层可映射为一步「检修」） */
type ArithmeticQuestion = {
  /** 稳定 id：用于会话内去重、埋点；建议含日期与学生无关的 hash，避免泄露答案 */
  id: string;
  /** 左操作数 */
  a: number;
  /** 运算符：首期仅 + / - */
  op: "+" | "-";
  /** 右操作数 */
  b: number;
  /** 标准答案（服务端校验用；不得下发给前端用于直显作弊） */
  // answer: number; // 仅服务端持有或在提交时计算
};

/** 当日工单：由出题器生成，长度固定或可配置 */
type MaintenanceSessionSpec = {
  /** 自然日键，如 YYYY-MM-DD */
  dateKey: string;
  /** 题目序列 */
  questions: ArithmeticQuestion[];
  /** 生成元信息：generator 版本、pool 版本，便于排错 */
  meta: { generatorId: string; version: string };
};
```

### 3.3 出题器接口（概念）

- **输入**：`{ studentId: string; dateKey: string; grade: "G1" | ...; config: GeneratorConfig }`
- **输出**：`MaintenanceSessionSpec`
- **确定性**：同一 `studentId + dateKey + generator 版本 + config` 应生成**相同题目序列**（便于刷新页面一致、服务端校验答案无需存全题 JSON，可选只存 `sessionHash`）。

### 3.4 首期实现策略（固定但可扩展）

- 实现 **`FixedGrade1MaintenanceGenerator`**（名称可调整）：
  - 从 **固定数组题池** 按 `hash(studentId, dateKey)` **确定性抽样 / 排序**，或
  - 使用 **简单规则**（如在约束内随机但 seed 固定）生成 **N 道题**（N 默认 **5～8**，配置化）。
- 所有常量与池数据放在 **`src/lib/maintenance-math/`**（或 `src/config/`）下独立文件，**不与 React 组件耦合**。

### 3.5 安全与校验

- **答案校验仅在服务端**：客户端可本地校验以提升体验，但**提交接口以服务端重算为准**。
- **可选**：请求携带 `questionIds` 顺序与 `answers`，服务端根据同一 generator 规则复现期望答案并比对；或会话开始时服务端下发**无答案的题目 DTO**，提交时再验。

---

## 4. 验收标准（Acceptance Criteria）

- [ ] 家长端设置中可 **开启/关闭「机甲维修」**，**默认开启**；保存后立即影响学生端入口与 API 可用性。
- [ ] 学生端在功能开启时存在入口进入「机甲维修」流程；关闭时**无入口**且接口拒绝游玩；**全文不使用「考试/测验」类文案**（以叙事配置为准）。
- [ ] 每日自然日仅可 **完成 1 次**当日维修；**完成维修不产生任何积分**，无 `PointsLog` 记录。
- [ ] 题目数据经 **`ArithmeticQuestion` + 出题器模块** 生成；组件内**无**硬编码 `7+5` 等散题（测试桩除外）。
- [ ] 首期一年级范围与题量可在**单一配置**或 `GeneratorConfig` 中调整（如题数、题池 id）。
- [ ] 提供 **GET**（或合并进 profile）：功能是否开启（继承家长设置）、今日是否已完成维修。
- [ ] 提供 **POST** 提交答案：服务端校验家长开关、**校验功能开启**、落库（见 5.2），**不写积分流水**。
- [ ] 家长端（可选 P1）：总览或设置中展示「今日维修：未完成 / 已完成」——若本期不做，标注 **P2**。

---

## 5. 技术方案

### 5.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `src/lib/maintenance-math/types.ts`（或同级单文件） | 新增 | `ArithmeticQuestion`、`MaintenanceSessionSpec`、出题器接口 |
| `src/lib/maintenance-math/generator-grade1-fixed.ts` | 新增 | 首期固定池 / 确定性生成实现 |
| `src/lib/maintenance-math/index.ts` | 新增 | 按配置导出当前使用的 generator |
| `src/config/maintenance-math.ts` | 新增 | 每日题量、时区、年级键（无积分相关项） |
| `src/app/api/student/maintenance-math/session/route.ts` | 新增 | `GET` 当日工单；校验家长开关开启 |
| `src/app/api/student/maintenance-math/complete/route.ts` | 新增 | `POST` 提交答案、校验、写完成日志（不发分） |
| `src/app/api/parent/settings/route.ts`（或现有设置 PATCH） | 新增/修改 | 读写 `maintenanceMathEnabled` |
| `prisma/schema.prisma` | 修改 | 见 5.2：`Parent` 字段 + `StudentMaintenanceMathLog`，**不**扩展 `PointsLogType` |
| `src/app/api/student/profile/route.ts`（或合并） | 修改 | 挂载 `maintenanceMathStatus`（含家长是否开启） |
| `src/app/parent/settings/page.tsx`（或对应设置页） | 修改 | 维修功能开关 UI |
| `src/app/student/page.tsx` 与/或 `src/app/student/layout.tsx` | 修改 | 入口与导航 |
| `src/components/student/maintenance-math/` | 新增 | 维修流程 UI：进度、数字键盘或输入、完成动画占位 |
| `src/contexts/DataContext.tsx` | 可选修改 | 若首页需展示维修状态 |

### 5.2 数据库设计（Database Design）

**新增 `StudentMaintenanceMathLog`（建议命名）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | cuid | 主键 |
| `studentId` | FK | 学生 |
| `completedOn` | DateTime @db.Date | 完成所属自然日 |
| `completedAt` | DateTime | 完成时刻 |
| `correctCount` | Int | 正确数 |
| `totalCount` | Int | 总题数 |
| `generatorId` | String | 出题器标识 |
| `sessionHash` | String? | 可选：当日会话指纹 |

```prisma
// 约束：每学生每自然日最多一条完成记录（与业务一致）
@@unique([studentId, completedOn])
```

**`Parent` 扩展（家长开关）**

```prisma
model Parent {
  // ...existing
  maintenanceMathEnabled Boolean @default(true) // 机甲维修（口算）：默认开启
}
```

迁移命令：`npx prisma migrate dev --name parent_maintenance_math_toggle_and_student_log`

### 5.3 前端设计（Frontend Design）

- **路由**：建议 `src/app/student/maintenance-math/page.tsx`（或 `student/repair/page.tsx` 若更偏叙事），从学生首页进入。
- **流程**：载入 → 展示「今日维修工单」与主机甲 → 逐步「检修」输入答案 → 完成页简短动画 + 文案（可复用现有机甲展示组件资源）。
- **风格**：与**学生端**深蓝科技风一致；错误反馈柔和，符合一年级心理（无恐吓性红色大叉为主视觉）。
- **响应式**：与 PRD 学生端安全区、触控友好大按钮一致。
- **无障碍**：大号数字、可选语音朗读为 **P2**（本 story 可不实现）。

---

## 6. 依赖与风险

- **依赖**：学生鉴权与现有一致；自然日与时区与 `0002` 战斗等模块**统一常量**。
- **风险**：纯前端出题易被篡改——**必须以服务端校验为准**。
- **风险**：家长关闭后学生若收藏旧 URL——接口层拒绝并可在学生端提示「家长已关闭该功能」。

---

## 7. 优先级（可选）

- [ ] P0：家长开关（默认开）+ 出题器抽象 + 一年级固定实现 + 每日一次 + 学生端闭环 + 服务端校验 + 落库（无积分）
- [ ] P1：家长端可见「今日维修是否完成」
- [ ] P2：多年级 generator、题池后台化、音效与更完整动画

---

## 8. 非目标（本期不做）

- 排行榜、同学 PK、限时排行榜
- 替代家长任务或自动把「维修」计为语文/数学作业完成
- 家长端出题编辑（若需另开 story）
