# 战力值系统（各机甲等级分求和 + 道具）

> 概述：引入**战力值**作为学生当前「作战能力」的单一展示指标。战力由两部分构成：**已领养机甲各自档位求和**——对每一台 `StudentMecha` 用积分对齐该机甲的 `MechaLevel`，得到 `level_i`，再 **`levelSum = Σ level_i`**，**`levelScore = levelSum × LEVEL_MULTIPLIER`**（与主机甲切换无关，换机养新机不会掉已计入的其它机体等级分）；以及**道具库存带来的加成**（每件道具可配置单位贡献，按持有数量累加）。首期以**计算、展示、API 透出**为主；与每日战斗胜率的关系可作为后续 story 的可选挂钩（本 story 不强制改 `winProbability`）。

**关联**：机甲等级与积分阈值见 `MechaLevel`、`getCurrentMechaLevelFromPoints`（`src/lib/mecha-level.ts`）；道具与库存见 `Item` / `StudentItem`（`docs/stories/0003-student-item-inventory.md`）；**任务积分与主页展示仍只绑定主机甲**（`Student.primaryMechaId`）；战力等级分为**多机甲 level 求和**，见 **§2.1**；战斗裁决见 `docs/stories/0002-student-battle-system.md`。

---

## 1. 用户故事

**作为** 学生  
**我想要** 在首页或机甲/战斗相关页看到**清晰的战力数字**，并理解它来自「**每一台机甲的等级加在一起**」和「我有哪些加战力的道具」  
**以便** 有直观的成长反馈，多领养、多养成都有回报；**换主机甲练新机时不会因为只盯着主机甲而突然少了一大截等级分**

**作为家长 / 产品**  
**我想要** 战力公式可配置、道具贡献可种子维护  
**以便** 控制数值膨胀，并在后续活动或战斗中复用同一套战力定义

---

## 2. 业务规则（细化）

### 2.1 定义：等级分 = 每台机甲的档位 `level` 求和（不是 max，不是仅主机甲）

- **问题**：若等级分**只取主机甲**，则第一台练满后，为养新机把**主机甲切到新机**时，新机积分低 → **战力会明显下降**，打击「开练第二台」的意愿。
- **规则（推荐）**：对这名学生的**每一条** `StudentMecha`（已领养）分别计算当前档位 `level_i`：
  1. 加载该机甲对应 `Mecha` 的 `levels`（按 `threshold` 升序）；
  2. 用该机甲的 `StudentMecha.points` 调用 `getCurrentMechaLevelFromPoints`，得到 `MechaLevel` 行（可能为 `null`，该台视为 `level_i = 0` 或按验收写死的规则）；
  3. **`levelSum = Σ level_i`**（对所有已领养机甲求和）。**零台**领养时 `levelSum = 0`。
- **战力中的「等级分」**：  
  `levelScore = levelSum * LEVEL_MULTIPLIER`  
  等价写法：先算每台 `levelScore_i = level_i * LEVEL_MULTIPLIER`，再 **`levelScore = Σ levelScore_i`**（乘法分配律，两种实现一致）。  
  `LEVEL_MULTIPLIER` 为**正整数常量**（默认 **10**，放入 `src/lib/combat-power.ts` 或 `src/config/combat-power.ts`）。
- **与主机甲的关系**：**任务确认加分、首页主展示机甲**仍只写入/指向 `primaryMecha`；**战力**是账号维度的「各机甲等级分之和 + 道具」。文案建议：**「战力里等级这块，是你每一台领养的机甲各自练到第几档加起来的」**。
- **换主机甲**：不改变其它机体的 `points` 与 `level_i`，**`levelSum` 不因切换主机甲而减少**；新领养一台会从 `level_新` 开始把数字往上加。

### 2.2 等级部分（计算细节）

- 单机甲：`levelSum = level_1`，与只养一台时直觉一致。
- 多机甲：不同 `Mecha` 的等级条（阈值、档位数）可以不同；**各自**得到 `level_i` 后**相加**。不取 max，避免「只显示最强一台」与「希望每台养成都有贡献」不一致。

### 2.3 道具部分（来自库存）

- 每件全局道具可配置**单位战力贡献** `combatBonus`（整数，**默认 0**）：仅对 `isActive === true` 的道具计入；展示类道具默认可为 0，武器/装备类在种子中填正数。
- 学生对某道具持有 `quantity` 时，贡献为 `quantity * item.combatBonus`。
- **总道具贡献** = 对所有该学生 `StudentItem` 行求和（`quantity > 0` 才计入，或 `quantity * combatBonus` 天然为 0）。

### 2.4 总战力公式（固定）

\[
\text{levelSum} = \sum_{\text{已领养机甲}} \text{level}_i,\quad
\text{levelScore} = \text{levelSum} \times \text{LEVEL\_MULTIPLIER},\quad
\text{combatPower} = \text{levelScore} + \sum_{\text{items}} (\text{quantity} \times \text{combatBonus})
\]

- 结果为非负整数；若计算中出现小数，**向下取整**或**全程整数运算**（推荐全程整数）。
- **不与**家长 `baseScore`（积分显示倍率）挂钩：战力是独立游戏数值，避免家长改显示倍率时战力乱跳。若未来产品要求一致，再单独立项。

### 2.5 展示与解释（建议）

- 学生端可展示：**总战力** + 可展开的「等级贡献 / 道具贡献」明细（便于理解）。
- 家长端可选：dashboard 仅显示总战力或暂不展示（本 story 以**学生端必显**、家长端**可选**为验收粒度）。

### 2.6 主机甲「养成满」之后如何继续激励？（产品策略）

在 **§2.1 已用「各机甲 level 求和」** 的前提下：多领养一台就会多一个 `level_i` 进总和；第一台满级后练第二台，**`levelSum` 随第二台成长持续上升**；切换主机甲不扣其它机体的养成进度。仍可与下列手段组合：

| 方向 | 说明 |
|------|------|
| **道具线仍可持续** | `fromItems` 与等级分独立；活动/战斗掉落、装备类道具继续拉高总战力。 |
| **多机甲养成** | 每台多练一级，`levelSum` 多涨一截，**多收集、多练满**在数字上直接可见。 |
| **非战力激励（并行目标）** | 积分、兑换、战斗、维修、成就（如 `0001`）等，避免只绑一个数字。 |
| **内容扩展** | 新机甲、新等级档、新道具、限时主题；长期可另开 **声望 / 二周目** story。 |

**可选后续扩展（另立 story）**

- **满级展示**：任一台机甲达最高 `MechaLevel` 时显示「满级」徽章等。
- **调参**：若发现「领养很多台、每台低等级」总和压过「少数台满级」，可通过 **`LEVEL_MULTIPLIER`、单台 `level` 上限表或软上限** 微调（见 **§5 风险**）。

**原则**：首期 0008 采用 **§2.4 公式** + **§2.1 的 level 求和规则**。

---

## 3. 验收标准（Acceptance Criteria）

- [ ] Prisma `Item` 增加字段 `combatBonus`（`Int`，默认 `0`），迁移与种子同步；现有道具默认贡献为 0 时总战力仅来自等级分。
- [ ] 存在**纯函数**（可单测）`computeCombatPower({ levelSum, levelMultiplier, items })` 或 `levels: number[]` 输入（或与 DB 解耦的输入类型），避免业务散落在路由里。
- [ ] `GET /api/student/profile`（或专用 `GET /api/student/combat-power`）返回：`combatPower`（总）、`fromLevel`、`fromItems`、`levelSum`、`levelMultiplier`；**建议**附带每台已领养机甲的 `mechaSlug` + `level_i` 便于 UI 展示「各机贡献」或调试。
- [ ] **回归场景**：学生有两台领养机甲 A、B，**仅切换主机甲**时，两台 `points` 未变，则 `levelSum` / `fromLevel` **不变**；道具部分仍按全库存累加。
- [ ] 学生端至少在**一处**主路径页面展示战力（建议：**学生首页**或**机甲库/战斗页**其一，具体以实现时 UI 为准），文案避免与「积分」混淆。
- [ ] 单元测试覆盖：无道具仅有等级、无等级仅有道具、边界 quantity=0、多道具堆叠、**多机甲 level 求和**、两台机甲 `level` 已知时 `levelSum` 等于其和、切换主机甲不改变 `levelSum`（points 不变）的用例。

---

## 4. 技术方案

### 4.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `prisma/schema.prisma` | 修改 | `Item` 增加 `combatBonus Int @default(0)` |
| `prisma/migrations/*` | 新增 | `migrate dev --name item_combat_bonus` |
| `prisma/seed-data/items.ts` | 修改 | 可选为部分道具写入非 0 `combatBonus`（联调） |
| `src/lib/combat-power.ts` | 新增 | `LEVEL_MULTIPLIER` 常量、`sumItemCombatBonus`、`computeCombatPower` 纯函数 |
| `src/lib/combat-power-server.ts`（或并入 `src/app/api/student/profile/route.ts` 的私有函数） | 新增/内联 | 查询**全部** `studentMechas`（含各 `Mecha.levels`）+ `StudentItem`×`Item`；对每台算 `level_i`，**求和得 `levelSum`**，再算 `fromItems` |
| `src/app/api/student/profile/route.ts` | 修改 | `include` 学生下所有 `StudentMecha` 及对应 `Mecha.levels`；查询库存；挂载 `combatPower` 相关字段 |
| `src/contexts/DataContext.tsx` | 修改 | `StudentData` 扩展战力字段；`refetch` 解析 |
| `src/types/index.ts` | 修改 | `StudentData` 类型同步 |
| `src/app/student/page.tsx` 或 `src/components/battle/MechaBattle.tsx` 等 | 修改 | 展示战力（择一主入口，避免多处重复时可抽 `CombatPowerBadge`） |
| `src/lib/combat-power.test.ts` 或 `*.test.ts` | 新增 | 纯函数与简单集成逻辑测试 |

**本 story 不强制修改**：`src/lib/battle.ts` 胜率公式；若仅预留注释「未来可按战力差修正胜率」即可。

### 4.2 数据库设计（Database Design）

在现有 `Item` 上扩展：

```prisma
model Item {
  // ... 既有字段
  combatBonus Int @default(0) // 每件持有数量乘上后的单位战力贡献
}
```

- **索引**：不必为 `combatBonus` 单独建索引（筛选量小）。
- **历史数据**：迁移后默认 0，不改变现有行为。

### 4.3 前端设计（Frontend Design）

- **页面**：优先 **`/student`（首页）** 在机甲/积分区块附近增加一行「战力」数字；若首页信息过载，可改为 **`/student/battle`** 战斗入口旁。
- **组件**：可选 `CombatPowerSummary`：主数字 + 「等级 xx · 道具 xx」副文案（`text-sm`、`text-s-text-secondary`），与家长端卡片风格区分、保持学生端科技卡通简洁。
- **交互**：无需单独提交；依赖 profile 拉取后与 `DataContext` 同步即可。
- **空状态**：无主机甲时展示「—」或「先领养机甲」，与产品对默认等级约定一致。

---

## 5. 依赖与风险

| 类型 | 说明 |
|------|------|
| **依赖** | `0003` 道具与库存表；`MechaLevel` 种子完整 |
| **风险** | 道具 `combatBonus` 若后期过大易导致战力膨胀；建议 PRD 外再设**软上限**或版本化（后续） |
| **风险** | 文案需区分：**任务积分归主机甲** vs **战力等级分 = 各领养机甲 level 之和**——避免与「当前主页那台」混淆。 |
| **风险** | **多机、每台等级都不高时**，`Σ level_i` 可能**高于**「少数机满级」的预期，需用 `LEVEL_MULTIPLIER`、机甲数量与等级表共同调参；若极端膨胀，可后续讨论**单台贡献上限**或**折减系数**（另立 story）。 |

---

## 6. 优先级

**P1（建议下一迭代）**：展示与公式落地后，再评估是否将战力纳入战斗胜率或 PVP（未规划则保持展示向）。

**与 §2.6 的关系**：0008 以 **各机 level 求和 + 道具** 体现多机甲养成；满级徽章、贡献上限调参等仍可另排 story。
