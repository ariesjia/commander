# 机甲里程碑技能（MechaSkill 表 + 全机甲技能文案 + Seed）

> 概述：为每台机甲配置 **3 个里程碑技能**，在学生将该机甲养成至 **等级 2、5、7** 时分别「解锁」对应技能（解锁状态由 **`StudentMecha.points` 推导当前等级**，不在学生表重复存储）。每条技能需带 **类型**（攻击、防御、增益、治疗、控制、支援等），便于图鉴筛选、战斗叙事分类与后续数值规则。技能元数据使用独立表 **`MechaSkill`** 持久化；种子数据与现网 **`prisma/seed-data/mechas.ts`** 对齐，并扩展 **`prisma/seed.ts`** 的 `seedMecha` 流程以同步技能行。

> **关联**：`Mecha` / `MechaLevel`（`prisma/schema.prisma`）；战斗叙事中敌人技能见 `src/lib/battle-enemies.ts`、`buildServerBattleSteps`（本 story 可将「已解锁玩家技能名」纳入战斗 API 响应，与敌人对称，**可作为同一迭代或后续小迭代**）。

---

## 1. 用户故事

**作为** 学生 / 家长  
**我想要** 在机甲达到特定等级时看到「新技能」的名称与描述，并在图鉴或详情中了解成长路线  
**以便** 强化养成反馈与角色代入感

**作为** 开发  
**我想要** 技能配置集中在数据库 + seed，并有稳定 `slug` 供 API 与战斗引用  
**以便** 后续扩展战斗效果、成就或统计时不反复改表结构

---

## 2. 业务规则

| 规则 | 说明 |
|------|------|
| 里程碑等级 | 固定 **2、5、7**；每台机甲恰好 **3** 条 `MechaSkill` 记录，`unlockLevel` 分别为 2、5、7 |
| 解锁判定 | `currentLevel` 由积分与 `MechaLevel.threshold` 计算（与 `/api/mechas/[slug]/level` 一致）；当 `currentLevel >= unlockLevel` 时视为已解锁 |
| 不存储学生解锁状态 | 积分不回退则无需 `StudentMechaSkill`；若未来存在降级或「遗忘技能」需另开 story |
| `slug` | 全局建议在应用层保证「**同一 mechaId 内唯一**」（DB `@@unique([mechaId, slug])`） |
| 技能类型 `kind` | 枚举 **`MechaSkillKind`**（见 §4.2.1）；每条技能必须指定一类，用于展示标签与后续战斗/成就逻辑 |

---

## 3. 验收标准（Acceptance Criteria）

- [ ] `prisma/schema.prisma` 新增 `MechaSkill` 模型，`Mecha` 上增加 `skills MechaSkill[]` 关系；迁移命名如 `npx prisma migrate dev --name add_mecha_skill`
- [ ] `unlockLevel` 仅允许 **2 / 5 / 7**（应用校验 + 种子保证；可选在迁移 SQL 中加 `CHECK (unlock_level IN (2,5,7))`）
- [ ] `@@unique([mechaId, unlockLevel])` 与 `@@unique([mechaId, slug])` 生效
- [ ] `prisma/seed-data/mechas.ts` 为 **当前种子中的全部机甲** 各增加 3 条技能（`kind`、`slug`、`name`、`description`），见本文 **§6 技能文案表**
- [ ] `prisma/seed.ts` 中 `seedMecha`：**创建**机甲时一并 `create` 技能；**已存在**机甲时对比技能数据并 **upsert / 更新**，避免「已存在则跳过」导致技能永不更新
- [ ] 至少一条 API（如 `GET /api/mechas/[slug]` 或学生 profile 中机甲详情）返回 `skills` 列表，供前端展示（实现细节见 §4.3）
- [ ] （可选，建议同迭代或子任务）战斗响应携带「当前已解锁的玩家技能名称列表」，供 `battle-step-builder` / 文案池使用

---

## 4. 技术方案

### 4.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `prisma/schema.prisma` | 修改 | 新增 `MechaSkill`；`Mecha` 增加 `skills` 关系 |
| `prisma/migrations/...` | 新增 | `migrate dev` 生成 |
| `prisma/seed-data/mechas.ts` | 修改 | 扩展类型与各机甲 `skills: MechaSkillSeed[]` |
| `prisma/seed.ts` | 修改 | `seedMecha` 同步技能：create / update / 必要时按 `unlockLevel` upsert |
| `src/app/api/mechas/[slug]/route.ts`（或同类） | 修改 | 返回 `skills`（按 `unlockLevel` 排序） |
| `src/app/api/parent/mechas/route.ts` 等 | 修改 | 若家长端展示机甲详情，一并带上 `skills` |
| `src/types/index.ts` 或共用类型 | 修改 | 导出 `MechaSkill` 与 `MechaSkillKind` 前端类型；可提供中文 `kindLabel` 映射常量 |
| `src/lib/battle-server.ts` / `src/app/api/student/battle/route.ts` | 可选 | 解析当前出战机甲已解锁技能，写入响应 |
| `src/components/battle/battle-step-builder.ts` / `battle-narrative.ts` | 可选 | 使用 `playerSkills` 丰富玩家侧招式名 |

### 4.2 数据库设计（Database Design）

#### 4.2.1 技能类型枚举 `MechaSkillKind`

| 枚举值 | 中文标签（展示用） | 含义 |
|--------|-------------------|------|
| `ATTACK` | 攻击 | 直接伤害、爆发、火力压制 |
| `DEFENSE` | 防御 | 护盾、减伤、护罩、格挡类 |
| `BUFF` | 增益 | 己方属性/态势强化、团队加成、标记增伤（不对敌直接控场） |
| `HEAL` | 治疗 | 生命回复、急救、稳定伤势 |
| `CONTROL` | 控制 | 眩晕、牵引、麻痹、沉默干扰、牵制走位（偏对敌或战场控制） |
| `SUPPORT` | 支援 | 侦查、补给、投送、开通道、撤离引导等非伤害主轴的战场辅助 |

说明：若未来出现「伤害 + 控制」混合技能，**以产品主效果选一个主类型**；战斗脚本可用 `meta` 扩展细分，不在本枚举爆炸。

```prisma
enum MechaSkillKind {
  ATTACK
  DEFENSE
  BUFF
  HEAL
  CONTROL
  SUPPORT
}
```

#### 4.2.2 模型 `MechaSkill`

```prisma
model Mecha {
  // ...existing fields
  levels MechaLevel[]
  skills MechaSkill[]
  studentBattleLogs StudentBattleLog[]
}

model MechaSkill {
  id           String          @id @default(cuid())
  mechaId      String
  mecha        Mecha           @relation(fields: [mechaId], references: [id], onDelete: Cascade)
  unlockLevel  Int             // 仅 2、5、7
  kind         MechaSkillKind
  slug         String
  name         String
  description  String          @db.Text
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@unique([mechaId, unlockLevel])
  @@unique([mechaId, slug])
  @@index([mechaId])
  @@index([kind])
}
```

**种子 TypeScript 侧（与 `mechas.ts` 对齐）**

```ts
import type { MechaSkillKind } from "@prisma/client"; // 或本地字面量联合

export interface MechaSkillSeed {
  unlockLevel: 2 | 5 | 7;
  kind: MechaSkillKind;
  slug: string;
  name: string;
  description: string;
}

// MechaConfig 增加: skills: MechaSkillSeed[];
```

**迁移备注**：若需数据库层约束 `unlockLevel`，可在迁移 SQL 末尾追加：

```sql
ALTER TABLE "MechaSkill" ADD CONSTRAINT "MechaSkill_unlockLevel_check"
  CHECK ("unlockLevel" IN (2, 5, 7));
```

（若团队倾向仅应用层校验，可省略。）

### 4.3 前端设计（Frontend Design）

| 区域 | 说明 |
|------|------|
| 家长端机甲列表/详情 | 在等级时间轴或独立「技能」区块展示 2/5/7 三个节点；未解锁灰显 + 所需等级；每条技能展示 **类型标签**（与 §4.2.1 中文标签一致） |
| 学生端 | 与主机甲展示一致：已解锁技能显示名称、类型与描述；可按类型筛选（可选） |
| 战斗页（可选） | 展示「我的招式」与「敌方招式」对称列表，增强代入 |

**交互**：技能为静态配置，无单独「学习」按钮；升级积分达标后自动出现在列表中。

---

## 5. 依赖与风险

| 项目 | 说明 |
|------|------|
| 依赖 | 现有 `MechaLevel` 等级体系与积分算级逻辑不变 |
| 风险 | 历史环境已跑过 seed：需在 `seedMecha` 中 **更新** 技能行，避免旧库缺数据 |
| 风险 | `slug` 改名会破坏外部引用；上线后仅改 `name`/`description`/`kind` 更安全 |

**优先级**：中高（养成核心反馈 + 数据模型基础）

---

## 6. 技能文案表（全机甲 · 每台 3 个）

说明：`slug` 约定为 **`{机甲 slug}-{语义短横线}`**，在同一 `mechaId` 内唯一。`kind` 为 **`MechaSkillKind`**（§4.2.1）。以下为 **可直接写入 seed** 的文案草案。

### 6.1 玄甲 `xuanjia`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `ATTACK` | `xuanjia-rift-charge` | 裂阵冲拳 | 双臂推进器短距爆发，向前突击撕开敌方正面防线第一道缺口，为后续部队打开通道。 |
| 5 | `ATTACK` | `xuanjia-fort-barrage` | 重铠炮轰 | 展开肩部重火力单元，对阵地目标进行压制齐射，以火力覆盖迫使敌方收缩阵型。 |
| 7 | `ATTACK` | `xuanjia-final-cleave` | 玄甲终焉斩 | 核心短时过载，全开装甲与近战武装发动决定性突破，对关键目标执行正面歼灭。 |

### 6.2 星盾 `star-shield`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `DEFENSE` | `star-shield-star-ring` | 星环庇护 | 展开环形护盾吸收来袭火力，为身边友军争取重整与撤退时间。 |
| 5 | `DEFENSE` | `star-shield-dawn-reflect` | 辰辉反弹 | 将所受部分冲击转化为定向反震波，干扰敌方攻势节奏并打断连续压制。 |
| 7 | `DEFENSE` | `star-shield-absolute-dome` | 绝对星穹 | 构筑大范围屏障，在短时间内将团队笼罩于高覆盖防护之下，对抗爆发集火。 |

### 6.3 利刃 `razor`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `ATTACK` | `razor-zig-slash` | 折线闪切 | 以折线机动贴近目标，等离子刃短促切割弱点，追求最小暴露时间。 |
| 5 | `ATTACK` | `razor-thunder-lunge` | 雷霆突刺 | 全推进器爆发直线贯穿，针对敌阵中的高价值目标实施一击穿透。 |
| 7 | `ATTACK` | `razor-final-verdict` | 利刃终裁 | 多段连斩与尾焰收尾衔接，对锁定目标执行单点歼灭裁决。 |

### 6.4 风驰 `swift`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `SUPPORT` | `swift-wind-mark` | 风标侦测 | 释放微型浮标扫描局部地形与热源，为友军标定视野与可疑动向。 |
| 5 | `CONTROL` | `swift-feint-pull` | 迂回牵引 | 高速蛇形机动吸引火力，牵制敌方并为队友创造侧翼窗口与安全转移时间。 |
| 7 | `BUFF` | `swift-full-map` | 全域信标 | 将战场态势压缩回传指挥链，使全队短时共享统一战术图层。 |

### 6.5 雷啸 `thunder`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `CONTROL` | `thunder-arc-sweep` | 电弧横扫 | 扇形释放连锁电弧，对接触单位造成短暂麻痹与持续骚扰。 |
| 5 | `ATTACK` | `thunder-storm-zone` | 雷域降临 | 在指定区域落下持续雷暴，覆盖群体伤害并压制敌方推进。 |
| 7 | `ATTACK` | `thunder-judgment-bolt` | 万钧天罚 | 集束雷柱轰击中心点，对密集敌军发动毁灭性爆发打击。 |

### 6.6 磁暴 `magnet`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `CONTROL` | `magnet-dipole-pull` | 双极牵引 | 对单体施加强引力，拖慢其位移并扰乱武器与传感瞄准。 |
| 5 | `CONTROL` | `magnet-maelstrom` | 磁暴涡流 | 在地面形成旋转磁场，干扰敌方电子设备并打乱其阵型衔接。 |
| 7 | `CONTROL` | `magnet-collapse` | 引力坍缩 | 短暂将区域内敌人向中心牵引，为友军创造集火与控场窗口。 |

### 6.7 空境 `aether`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `SUPPORT` | `aether-drop-supply` | 伞降补给 | 对地面小队空投应急物资与弹药箱，保障前线持续输出。 |
| 5 | `BUFF` | `aether-formation-shift` | 编队跃迁 | 优化友军单位之间的战术转场路径，缩短暴露在威胁区的时间。 |
| 7 | `SUPPORT` | `aether-sky-corridor` | 天境走廊 | 开启持续一段时间的空中安全走廊，引导单位规避地对空高危区域。 |

### 6.8 沧龙 `tidal`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `ATTACK` | `tidal-torpedo-snipe` | 潜射鱼叉 | 水下发射制导鱼雷，对水面或沿岸目标发动隐蔽突袭。 |
| 5 | `ATTACK` | `tidal-abyss-barrage` | 幽洋弹幕 | 上浮后遥控舰甲武器站进行覆盖射击，压制封锁水域。 |
| 7 | `ATTACK` | `tidal-devour-tide` | 沧龙吞潮 | 联合主炮与潜航姿态发动总攻，对目标水域执行毁灭性封锁。 |

### 6.9 镇岳 `titan-fort`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `DEFENSE` | `titan-fort-anchor-spike` | 固守钉刺 | 展开驻锄与侧装甲进入固守姿态，提升原地抗击打能力并反击近身目标。 |
| 5 | `ATTACK` | `titan-fort-bastion-salvo` | 壁垒齐射 | 全炮塔同步对正面扇形区域倾泻火力，形成移动火力堡垒。 |
| 7 | `DEFENSE` | `titan-fort-immovable` | 镇岳不动 | 进入极限防御姿态，以车身为核心为全队提供掩护与战线稳定（叙事效果，数值实现可后续接入）。 |

### 6.10 地渊 `tunnel`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `SUPPORT` | `tunnel-drill-burst` | 地脉钻头 | 硬化钻头部件快速打通短距岩层通道，供自身或友军穿行。 |
| 5 | `ATTACK` | `tunnel-ambush-surge` | 裂隙奔袭 | 自地下出口突然窜出袭击侧后，再潜回地下脱离火力网。 |
| 7 | `SUPPORT` | `tunnel-deep-network` | 深渊路网 | 为团队建立多条隐蔽地下机动线，支援包抄、补给与撤离。 |

### 6.11 方舟 `ark`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `SUPPORT` | `ark-emergency-drop` | 应急空投 | 无人机群向最近友军投送维修单元与弹药，缓解前线断供。 |
| 5 | `BUFF` | `ark-perpetual-beacon` | 永续中继 | 在前线部署补给信标，小范围内持续保障友军作战续航（叙事层）。 |
| 7 | `SUPPORT` | `ark-covenant` | 方舟盟约 | 全域协调多趟补给航线，使持久战中的弹药与能源分配最优化。 |

### 6.12 济世 `medecac`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `HEAL` | `medecac-life-pulse` | 生命脉冲 | 对单体伤员注入稳定剂与止血雾，延缓创伤恶化争取救治时间。 |
| 5 | `HEAL` | `medecac-swarm-aid` | 蜂群急救 | 释放医疗无人机群，对区域内多名伤员并行检测与急救处理。 |
| 7 | `SUPPORT` | `medecac-evac-corridor` | 净土撤离 | 开辟受掩撤离走廊，优先将重伤员转移至安全区与后送节点。 |

### 6.13 铁龙 `iron-dragon`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `ATTACK` | `iron-dragon-battery-volley` | 联装齐射 | 多节车厢武器站同时对准同一目标区射击，形成瞬间火力峰值。 |
| 5 | `ATTACK` | `iron-dragon-line-blockade` | 长编封锁 | 车体展开侧翼炮塔，绵延火力覆盖铁路走廊，阻断敌方机动。 |
| 7 | `ATTACK` | `iron-dragon-terminal-blitz` | 铁龙终站 | 全车核心供能于主炮，执行一次轨道级毁灭轰击，清场关键节点。 |

### 6.14 猎犬 `hound`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `CONTROL` | `hound-lock-bite` | 撕咬固定 | 利齿钳制目标下肢或武器，造成持续控制并暴露其破绽。 |
| 5 | `ATTACK` | `hound-rabid-rush` | 狂犬连扑 | 三连扑击与尾焰推进结合，对单目标发动爆发性近距输出。 |
| 7 | `BUFF` | `hound-alpha-mark` | 猎王号令 | 标记猎物并引导周围友军同步集火，完成围歼与清场（叙事层）。 |

### 6.15 俯冲 `dive`

| unlockLevel | kind | slug | name | description |
|-------------|------|------|------|-------------|
| 2 | `ATTACK` | `dive-ap-dart` | 疾降穿甲 | 加速俯冲投下单枚动能穿甲弹，贯穿装甲并毁伤关键部件。 |
| 5 | `ATTACK` | `dive-sweep-bomb` | 掠影轰炸 | 低空连续投弹，覆盖狭长地带，压制敌方行进纵队。 |
| 7 | `ATTACK` | `dive-sky-strike` | 天罚俯冲 | 自高空垂直贯穿打击核心目标，追求一击决定战局。 |

---

## 7. Seed 脚本要点（实现 checklist）

1. **类型**：`MechaConfig` 增加 `skills: MechaSkillSeed[]`，长度固定为 3，且 `unlockLevel` 为 2、5、7 各一；每条含 **`kind: MechaSkillKind`**（可在类型上用联合类型 + 常量数组校验）。
2. **创建机甲**：`mecha.create({ data: { ..., skills: { create: config.skills.map(...) } } })`。
3. **已存在机甲**：
   - 查询 `existing.skills`；
   - 对每个 `unlockLevel`：若不存在则 `create`；若存在则 `update` `kind`/`slug`/`name`/`description`（与 level 行更新策略一致）；
   - 若 DB 中多出未知 `unlockLevel`（脏数据），可删除或日志告警。
4. **幂等**：多次执行 `pnpm db:seed` 后技能与文案与本文一致。

---

## 8. 参考

- `docs/PRD-机甲指挥官-学生游戏化激励系统.md`
- `docs/ADD_MECHA.md`
- `prisma/schema.prisma`、`prisma/seed-data/mechas.ts`、`prisma/seed.ts`
- `docs/stories/0002-student-battle-system.md`（战斗扩展可选）
