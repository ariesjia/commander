# 战斗演出日志后端化与技能反馈（胜率不变、数值与文案随机）

> 概述：将**战斗过程日志（含 HP 时间线、逐条战报文案、FX 提示）**改为**由后端在裁决战斗时生成**并随 API 返回（可选落库供「今日回放」一致）。在**不改变**现有 `battleSettings.winProbability` 与胜负裁决逻辑的前提下，引入**已解锁机甲技能**（`MechaSkill.kind`）对战报的影响：**治疗**体现为体力回复、**增益/防御/支援**等体现为后续攻受数值或文案差异；伤害/回复等**数值在配置范围内随机**，文案池**多样化**，避免每场观感雷同。

> **关联**：[0002-student-battle-system](./0002-student-battle-system.md)（每日战斗、胜负与奖励）、[0004-mecha-skills](./0004-mecha-skills.md)（技能类型枚举与解锁规则）；现网演出见 [`src/components/battle/battle-step-builder.ts`](../../src/components/battle/battle-step-builder.ts)（客户端生成）、[`src/app/api/student/battle/route.ts`](../../src/app/api/student/battle/route.ts)（仅返回 `narrative` + 敌人信息）。

---

## 1. 用户故事

**作为** 学生  
**我想要** 每场战斗的战报读起来像「有用招、有掉血/回血、有强弱变化」，且和当前机甲已解锁技能挂钩  
**以便** 养成与战斗演出更有代入感，而不是固定几条模板血条

**作为** 产品 / 开发  
**我想要** 胜负与奖励仍完全由后端配置与随机裁决，战报序列**可复现或可追溯**（至少当日回放与 POST 一致）  
**以便** 不破坏公平性，又便于排查与迭代文案池

---

## 2. 业务规则（细化）

### 2.1 胜负与奖励（不可破坏）

| 规则 | 说明 |
|------|------|
| 胜负 | 仍由 `rollBattleOutcome(battleSettings.winProbability)` 决定，**先于**战报时间线生成 |
| 奖励 | 仍仅在 `WIN` 时按 `winBattleRewards` 抽取；与战报生成顺序无关 |
| 战报 | **不得**反向改变胜负；HP 时间线终点必须与 `outcome` 一致（胜：敌方 0、我方大于 0；负：我方 0、敌方大于 0，与现客户端 WIN/LOSE 终点对齐或可文档化新终点，但须与 UI 一致） |

### 2.2 玩家技能数据来源

- 主机甲：`Student.primaryMecha` → `StudentMecha.points` + `MechaLevel.threshold` 得当前等级；`unlockLevel ≤ 当前等级` 的 `MechaSkill` 为**本场可用技能集合**（名称 + `kind` + `slug`）。
- 无主机甲或无技能：战报仍生成，仅**不插入**技能特化句，回退通用招式池（与现网类似）。

### 2.3 技能类型 → 演出语义（建议稿，实现可微调）

以下均为**演出层语义**（非真实 PVP 数值）；通过 **HP 条变化** 与 **文案** 体现。具体数值区间放 `battle-settings` 或同级配置，便于调参。

| `MechaSkillKind` | 战报反馈（示例方向） | HP / 节奏建议 |
|-------------------|----------------------|----------------|
| `HEAL` | 使用技能名 +「机体修复/护盾回充」等 | **我方 HP 上升**（随机量，有上限不超过当前阶段合理满血） |
| `BUFF` | 攻击力/火控增强等 | 后续 **我方攻击** 造成的敌方扣血 **略增**（随机系数），或多句强调「下一击更狠」 |
| `DEFENSE` | 护盾展开、装甲硬化 | 紧随的 **敌方攻击** 对我方扣血 **减轻**（随机减伤），或插入仅文案的「格挡」步（HP 少扣） |
| `SUPPORT` | 侦测/协调/补给辅助 | 后续 **我方伤害略增** 或 **下一击必中/必暴** 类文案（数值仍随机） |
| `ATTACK` | 主动技名称嵌入玩家命中句 | 与现有 `PLAYER_ACTIONS` 类似，但**优先**用技能名替换或混排 |
| `CONTROL` | 牵制、干扰、破读 | 可表现为 **敌方下一击伤害降低** 或 **插入闪避/硬直** 类 FX 与文案（终点仍服从胜负） |

**注意**：一场战斗可插入 **0～N** 个技能节点（按解锁数与剧本长度上限配置），不必每个技能都单独一步，可合并为「连续技」叙述；但需满足**多样性与随机性**验收。

### 2.4 随机性与多样性

- **数值**：同类操作（如敌方普攻、我方反击）使用**区间内随机整数**（或带权分布），配置项示例：`damageEnemyNormalMin/Max`、`damagePlayerCritMin/Max`、`healPlayerMin/Max`、`mitigationPercentRange` 等。
- **文案**：按 `kind`、攻守方、是否暴击、是否技能触发展开**多条模板池**随机；可与现有 [`battle-narrative.ts`](../../src/components/battle/battle-narrative.ts) 风格对齐。
- **结构**：保留中立句、闪避、道具插入等**随机占位**逻辑（可与现 `buildServerBattleSteps` 的 `neutralCount`、道具插入位对齐），但整体脚本改由服务端生成。

### 2.5 回放一致

- **POST 响应**携带完整 `steps`（或等价结构）时，客户端**不得**再调用 `buildServerBattleSteps` 覆盖。
- **今日回放**（`GET` battle status / `todayReplay`）：若落库 `stepsJson`，则回放与当场一致；若未落库，可约定用 `battleLogId` + 存证 `seed` 重放（二选一写清，推荐**落库 stepsJson** 降低前后端算法版本漂移风险）。

---

## 3. 验收标准（Acceptance Criteria）

- [ ] `POST /api/student/battle` 在成功体中返回 **`steps`**（类型与现 `ServerBattleStep[]` 对齐：`p`/`e`/`line`/`fx`），且与 `outcome` 终点 HP 一致。
- [ ] `winProbability`、奖励逻辑与 [battle-settings.ts](../../src/lib/battle-settings.ts) 行为**无回归**（可单测 / 统计抽检）。
- [ ] 当存在已解锁技能时，战报中**至少出现**与技能类型匹配的反馈（如 HEAL 出现回血类 HP 变化或明确文案）。
- [ ] 连续多场战斗：在相同 `outcome` 下，**扣血/回血数值或关键句**应有**可见随机差异**（非完全同一脚本）。
- [ ] 学生端 [`MechaBattle`](../../src/components/battle/MechaBattle.tsx) 使用服务端 `steps` 驱动 HP 与日志；无 `steps` 时保留**向后兼容**降级（仅开发期或旧数据）。
- [ ] 今日回放路径能展示与当日 POST **一致**的演出（依赖 `stepsJson` 或文档化 seed 方案）。
- [ ] 扩展 [`battle-fx-types.ts`](../../src/components/battle/battle-fx-types.ts) 时：新增 FX（如治疗光效、护盾）需同步 `useBattlePresentationFx` / CSS；若首期仅用 `none`/`strike`/`item` 也可在 story 中注明「分阶段交付」。

---

## 4. 技术方案

### 4.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `src/lib/battle-presentation.ts`（或 `battle-steps-server.ts`） | 新增 | 纯函数：`buildBattleStepsFromOutcome(...)`；**逆向构造** HP 时间线再反转为播放序，并生成 `line`/`fx` |
| `src/lib/battle-settings.ts` | 修改 | 增加伤害/治疗/减伤/插入概率等可调区间与开关 |
| `src/app/api/student/battle/route.ts` | 修改 | 查询主机甲已解锁技能；调用步骤生成；响应加入 `steps` |
| `src/lib/battle-server.ts` | 修改 | `TodayBattleReplayPayload` / `getBattleStatusForStudent` 携带 `steps` 或从 `StudentBattleLog` 读取 |
| `prisma/schema.prisma` | 修改（可选） | `StudentBattleLog` 增加 `stepsJson Json?`；迁移 `add_battle_log_steps` |
| `src/components/battle/MechaBattle.tsx` | 修改 | `ServerBattlePayload` 增加 `steps?`；有则跳过 `buildServerBattleSteps` |
| `src/app/student/battle/page.tsx` | 修改 | 映射 POST / replay 的 `steps` 到 `ServerBattlePayload` |
| `src/components/battle/battle-step-builder.ts` | 修改 | 保留为降级/演示用，或标 `@deprecated` 由服务端替代 |
| `src/components/battle/battle-narrative.ts` | 修改 | 抽取或复制可复用句式生成器，供服务端 import（注意仅依赖 node 安全子集，避免浏览器 API） |

**注意**：若 `battle-narrative` 仅能在客户端使用，应将**可共享**的纯字符串生成逻辑迁到 `src/lib/battle-narrative-shared.ts`（无 `window`），客户端与服务端共用。

### 4.2 数据库设计（Database Design）

**推荐**：为回放与客服排查，持久化演出步骤。

```prisma
model StudentBattleLog {
  // ...existing fields
  stepsJson Json?  // ServerBattleStep[] 快照
}
```

- 迁移：`npx prisma migrate dev --name add_student_battle_log_steps`
- 历史行 `null`：回放可走「旧客户端重建」降级或提示「本场为旧版战报」。

### 4.3 前端设计（Frontend Design）

- **战斗页**：接收 `steps` 后按现有 tick 逻辑逐条应用 `p`/`e`/`line`/`fx`（与现 `MechaBattle` 循环一致）。
- **结算区**：仍展示 `narrative` 与奖励；可选在详细战报列表中展示技能触发行（若已有 log UI）。
- **动效**：新 `BattleFx` 分支需遵循现有 `reduced-motion` 策略。

### 4.4 算法要点（约束胜负的生成方式）— **倾向逆向构造**

**推荐主路径：逆向构造（backward construction）**

1. **先钉死终点**（与 `outcome` 一致，且与现 UI 约定一致）：  
   - `WIN`：例如敌方 `e_final = 0`、我方 `p_final` 为配置中的正剩余（可与现 `battle-step-builder` 终点对齐，如 `p ∈ {64,82,100}` 之一或新区间）。  
   - `LOSE`：例如我方 `p_final = 0`、敌方 `e_final` 为正剩余（与现网 LOSE 终点对齐）。

2. **从终点向起点反推「事件」序列**（时间逆序）：  
   - 将整场战斗看成若干 **delta 事件**：我方普攻/暴击、敌方普攻、闪避（某步不伤血）、治疗（`p` 上升）、减伤（同一步敌方伤害折算变小）等。  
   - 每一步在逆序下是「撤销」上一状态：已知 `(p_k, e_k)`，随机一条合法事件得到 `(p_{k-1}, e_{k-1})`，直到达到起点 `(p_0, e_0)`（通常双方满血或与本场剧本约定的开场血）。  
   - **技能**：在逆序中预留「插槽」— 例如先决定某逆序步为「我方释放 HEAL」，则该步对应 `p` 较前一步**增加**，再为前后攻击步分配伤害使整条链闭合。

3. **约束与可解性**：  
   - 每类事件的 delta 取自配置区间（随机）；若某条链无法回到合法起点，**回退重试**（换随机或换事件顺序），或收紧区间。  
   - **胜负已预先决定**，逆向过程中禁止出现「未到终点已判负/胜」的矛盾；终点只在第一步（播放时的最后一步）满足。

4. **转为播放顺序**：将逆序事件列表 **reverse**，为每一步填 `line`（模板池 + 技能名）与 `fx`，得到 `ServerBattleStep[]`（每步的 `p`/`e` 为**该句播报后的快照**，与现前端一致）。

5. **与「模板骨架」的关系**：现 `battle-step-builder` 可作为 **事件类型与步数** 的参考（如 WIN 先暴击再闪避再连段），但不强制；逆向法更易在插入治疗/减伤后仍保证终点。

**备选（非首选）**：模板骨架 + 在关键帧之间填充随机伤害；需额外校验插入技能后不破坏终点 HP，调试成本通常更高。

**测试**：对 `buildBattleStepsFromOutcome` 编写**单元测试**：固定 `random()` 实现下，`WIN`/`LOSE` 最后一步的 `p`/`e` 与约定终点一致，且全程 `p,e ∈ [0,100]`（或配置上限）。

---

## 5. 依赖与风险

| 项目 | 说明 |
|------|------|
| 依赖 | [0004](./0004-mecha-skills.md) `MechaSkill` 已可用；战斗 API 已能解析 `primaryMecha` |
| 风险 | 服务端与客户端**重复维护**两套叙事时易漂移 → 用共享 `lib` + `stepsJson` 落库缓解 |
| 风险 | `steps` 体积增大 → 控制单步数上限、压缩 `fx` 为枚举 |

**优先级**：中高（体验核心 + 与公平性强相关，需测试覆盖）

---

## 6. 参考

- [`docs/stories/0002-student-battle-system.md`](./0002-student-battle-system.md)
- [`docs/stories/0004-mecha-skills.md`](./0004-mecha-skills.md)
- [`src/lib/battle.ts`](../../src/lib/battle.ts)、[`src/lib/battle-settings.ts`](../../src/lib/battle-settings.ts)
- [`src/components/battle/battle-step-builder.ts`](../../src/components/battle/battle-step-builder.ts)、[`battle-fx-types.ts`](../../src/components/battle/battle-fx-types.ts)
