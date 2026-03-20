# 学生端每日战斗系统（后端裁决 + 可配置数值）

> 概述：将现有「纯前端模拟战斗」升级为**受规则约束的每日战斗**：学生须在**当日通过完成任务获得的积分**累计达到门槛（默认 **5** 分，可配置）后才可发起战斗，**每日仅可战斗 1 次**；战斗结果由**后端随机生成**（胜/负 + 文案）；敌人从配置池随机抽取；**仅胜利**时有概率获得奖励（首期仅积分），发放积分须**写入积分流水**；数值与敌人数据集中在**配置文件**，奖励结构预留**道具等扩展**。

> **门槛积分定义**：仅指**完成任务**经家长确认后产生的加分（与现网一致，对应 `PointsLogType.TASK_REWARD`），**不包含**战斗奖励、兑换、撤销回滚等其他流水。

**关联**：现有演示页 `src/app/student/battle/page.tsx`、`src/components/battle/MechaBattle.tsx`；积分与流水模型见 `prisma/schema.prisma` 中 `PointsLog`、`PointsLogType`。

---

## 1. 用户故事

**作为** 学生  
**我想要** 在完成当日任务并获得足够任务积分后，每天进行一次机甲战斗并看到明确胜负与一句话战报  
**以便** 在既有任务激励之外，获得轻量、可预期的游戏化反馈；若胜利还有机会获得少量积分奖励

**作为家长/产品**  
**我想要** 战斗次数、门槛胜率、奖励分布均可通过配置调整  
**以便** 控制激励强度并便于 A/B 与后续扩展（道具等）

---

## 2. 业务规则（细化）

### 2.1 战斗资格

| 规则 | 说明 |
|------|------|
| 当日任务积分门槛 | 自然日（见 2.4）内，学生**通过完成任务得到的积分**（家长确认任务后的 `TASK_REWARD`）累计 ≥ `minPointsEarnedToday`（默认 **5**，**配置文件可读**） |
| 每日次数 | 每学生每自然日最多 **1** 次战斗（无论胜负） |
| 门槛积分来源（固定语义） | **仅**统计「完成任务」产生的加分；实现上与 `PointsLog.type === TASK_REWARD` 一致。**不包含**战斗奖励、兑换、退款、惩罚、撤销类流水；若未来新增「算任务努力」的类型，需产品明确后再扩展白名单（见 4.3 配置节） |

### 2.2 战斗流程与结果

1. 学生请求「开始战斗」（单次 API 即可完成裁决 + 落库，避免前端篡改）。
2. 服务端校验资格（2.1）与当日是否已战。
3. 从敌人配置池 **均匀随机** 选一个敌人（首批约 **8** 个，持续以配置扩充）。
4. 使用可配置概率判定 **胜利** 或 **失败**（默认胜利概率 **40%**，**配置文件**）。
5. 响应中返回：`outcome`（`WIN` \| `LOSE`）、`narrative`（一句话胜/负描述）、敌人展示信息（名称、描述、技能名列表、图片 URL 等）。
6. **失败**：不发放奖励，仍记一条战斗记录（便于统计与防重复）。
7. **胜利**：进入奖励解析（2.3）；若本次奖励为积分，则在同一事务内更新学生积分并写入 `PointsLog`。

### 2.3 胜利奖励（首期积分 + 可扩展）

- **触发条件**：仅当 `outcome === WIN` 时 roll 奖励（若未来需要「胜利但无奖」可在配置中加权重项）。
- **首期仅积分**：按**权重表**随机一档（默认：**70% → 1 分，20% → 2 分，10% → 3 分**），权重与分值均在**配置文件**。
- **扩展性（重要）**：配置与落库采用「奖励载荷」抽象，避免写死「只有 int 分数」：

```ts
/** 首期仅实现 points；未来可增加 item 等分支 */
type BattleRewardGrant =
  | { kind: "points"; amount: number }
  | { kind: "item"; itemSlug: string; quantity: number }; // 未来：需库存/道具表时再实现
```

- 服务端 roll 出 `BattleRewardGrant` 后：
  - `points`：执行加分 + `PointsLog`（见 3.2）。
  - `item`：本期 story **可不实现发放逻辑**，但配置结构与 API 响应字段应能携带 `rewards: BattleRewardGrant[]`（或单对象），便于下一迭代接表。

### 2.4 自然日边界

- 默认使用服务器时区或产品指定时区（建议与任务确认、报表一致，例如 **Asia/Shanghai**），在 story 实现时**写死一处**并在配置或常量中注明，避免学生跨日争议。

### 2.5 胜负文案

- 配置层支持：**按敌人**维护胜/负文案池（字符串数组），服务端随机取一句；若无独立配置则回退到全局默认池。
- 响应字段统一为 `narrative: string`（一句）。

---

## 3. 验收标准（Acceptance Criteria）

- [ ] `minPointsEarnedToday`、当日门槛所用的任务积分类型（默认仅 `TASK_REWARD`）、`winProbability`、积分奖励 `weight + amount` 表均在**单一配置文件**（或同目录 `battle-settings.ts` + `battle-enemies.ts`）中可调。
- [ ] 学生当日**任务完成所得积分**未达阈值时，战斗 API 返回明确错误（如 403/409 + 文案），且不消耗当日战斗次数。
- [ ] 学生当日已战斗过时，再次请求被拒绝，且不重复扣分/加分。
- [ ] 战斗结果仅由服务端计算；响应包含胜/负、一句话描述、所选敌人信息。
- [ ] 敌人配置包含：`id`、`name`、`description`、`imageUrl`、`skills: string[]`（技能名称列表）；首批可占位 8 条，图片可走 `public/` 静态路径。
- [ ] 胜利且奖励为积分时：`Student.totalPoints` / `balance`（及与现有一致的 **primary 机甲 `StudentMecha.points`** 规则）更新，并新增 `PointsLog`，类型为**新增枚举值**（如 `BATTLE_REWARD`），描述中体现战斗与敌人信息。
- [ ] 学生端积分流水页能展示战斗奖励记录（现有 API 已过滤部分 undo 类型，需保证新类型在展示白名单内）。
- [ ] 提供「今日是否可战 / 已战 / 当前门槛进度」的查询能力（可合并进 profile 或独立 `GET`），供战斗页按钮态使用。

---

## 4. 技术方案

### 4.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `src/lib/battle-settings.ts`（或 `src/config/battle.ts`） | 新增 | 门槛、胜率、奖励权重表、时区/自然日工具引用 |
| `src/lib/battle-enemies.ts` 或 `prisma/seed-data/battle-enemies.ts` | 新增 | 8 个敌人静态配置 + 类型定义 |
| `src/lib/battle.ts` | 新增 | 资格计算、随机敌人、胜负、奖励 roll、文案选取（纯函数 + 可单测） |
| `src/app/api/student/battle/route.ts` | 新增 | `POST` 发起战斗；可选 `GET` 状态 |
| `prisma/schema.prisma` | 修改 | `PointsLogType` 增加 `BATTLE_REWARD`；新增 `StudentBattleLog`（或等价命名） |
| `src/app/api/student/profile/route.ts` 等 | 修改 | 可选挂载 `battleStatus` |
| `src/app/student/battle/page.tsx` | 修改 | 接真实 API，替换「纯前端演示」说明 |
| `src/components/battle/MechaBattle.tsx` | 修改 | 支持传入服务端返回的敌人与结果，或拆分为展示组件 + API 层 |

### 4.2 数据库设计（Database Design）

**`PointsLogType` 扩展**

```prisma
enum PointsLogType {
  // ...existing
  BATTLE_REWARD
}
```

**新增 `StudentBattleLog`（建议）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | cuid | 主键 |
| `studentId` | FK | 学生 |
| `foughtOn` | DateTime @db.Date 或 当天 0 点 DateTime | 战斗所属自然日（便于唯一约束） |
| `outcome` | enum WIN / LOSE | 胜负 |
| `enemyId` | String | 对应配置中的敌人 id |
| `narrative` | String | 当时返回的一句话 |
| `rewardsJson` | String? 或 Json | 奖励载荷快照（扩展道具时极有用） |
| `pointsLogId` | String? FK | 若发了积分则关联 `PointsLog`，便于审计 |
| `createdAt` | DateTime | 创建时间 |

- **唯一约束**：`@@unique([studentId, foughtOn])` 保证每日一次。
- 迁移：`npx prisma migrate dev --name student_battle_log`

**事务顺序（POST 战斗）**：校验 → 写 `StudentBattleLog` → 若胜且含积分则更新学生/机甲并写 `PointsLog` 并回写 `pointsLogId`。

### 4.3 配置示例（实现时以代码为准）

**settings（摘录）**

```ts
export const battleSettings = {
  timezone: "Asia/Shanghai",
  minPointsEarnedToday: 5,
  /** 计入「当日任务积分门槛」：默认仅家长确认任务后的奖励 */
  eligiblePointsLogTypesForThreshold: ["TASK_REWARD"] as const,
  winProbability: 0.4,
  /** 胜利后按权重抽一档；未来可插入 weight:0 表示「谢谢参与」 */
  winPointRewards: [
    { weight: 0.7, amount: 1 },
    { weight: 0.2, amount: 2 },
    { weight: 0.1, amount: 3 },
  ] as const,
};
```

**敌人（摘录）**

```ts
export interface BattleEnemyConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  skills: string[];
  winNarratives: string[];
  loseNarratives: string[];
}
```

### 4.4 前端设计（Frontend Design）

- **页面**：`app/student/battle` — 进入时拉取 `battleStatus`；按钮「开始战斗」在不可战时禁用并展示原因（当日任务积分未达门槛 / 今日已战）。
- **战斗演出**：可复用 `MechaBattle` 的动效，但**胜负结果必须以 API 返回为准**（前端不再自行 random 定胜负）。
- **风格**：延续学生端科技卡通与现有 `s-*` token；移动端主按钮 ≥44px 触控区域。

---

## 5. 依赖与风险

- **依赖**：与现有一致的学生鉴权、`getStudentId`、primary 机甲加分规则（对齐 `parent/tasks/[id]/confirm` 行为）。
- **风险**：门槛若误纳入非任务类 `PointsLogType` 会扭曲「完成任务再战斗」的产品语义——**默认仅 `TASK_REWARD`**；战斗奖励等类型必须排除在门槛统计之外。
- **风险**：时区与「自然日」若与家长端确认任务日期不一致，可能引发投诉——需与 PRD/报表统一时区并在文案中简短说明。

---

## 6. 优先级（可选）

- [x] P0 必须（核心规则 + API + 流水）
- [ ] P1 道具奖励实装（需道具模型与库存）
- [ ] P2 家长端报表/战斗记录查看

---

## 7. 与 PRD 的衔接建议

在 `docs/PRD-机甲指挥官-学生游戏化激励系统.md` 后续修订中可增加小节：**每日战斗**，引用本 story 编号与配置文件路径，避免文档与实现漂移。
