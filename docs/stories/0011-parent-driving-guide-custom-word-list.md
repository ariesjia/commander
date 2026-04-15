# 家长端配置「驾驶指南」词语列表（按学生独立）

> 概述：在现有 [`0009-student-driving-guide-hanzi`](./0009-student-driving-guide-hanzi.md) 实现基础上，将**默认代码词库**扩展为：家长可在**家长端设置**中为本账号下的**每个学生**维护一份**自定义词语列表**（用于当日驾驶指南会话的抽题池）。**未配置或清空时**回退为现有 `src/config/driving-guide-words.ts` 默认词库。列表**按学生存储、互不影响**；与 PRD「多孩家庭（后续版本）」对齐时，数据模型应落在 **`Student`** 而非 `Parent`。

**关联**：[`0009`](./0009-student-driving-guide-hanzi.md)（驾驶指南产品规则、10 字/5 步两字词、`session`/`step` API）；[`docs/PRD-机甲指挥官-学生游戏化激励系统.md`](../PRD-机甲指挥官-学生游戏化激励系统.md)（家长配置任务与激励、多孩后续）；实现参考 [`src/lib/driving-guide/session.ts`](../../src/lib/driving-guide/session.ts)、[`src/app/api/student/driving-guide/session/route.ts`](../../src/app/api/student/driving-guide/session/route.ts)、[`src/app/api/parent/settings/route.ts`](../../src/app/api/parent/settings/route.ts)。

---

## 1. 用户故事

**作为家长**  
**我想要** 在设置里为我的孩子配置「驾驶指南」使用的**词语/拼写练习词表**（可贴合校内字词、家庭辅导重点）  
**以便** 孩子在 MotiMech 里练的字词与家庭规划一致，而不是固定默认词库

**作为家长（多孩场景，设计预留）**  
**我想要** 每个孩子的词表**互不相同、独立保存**  
**以便** 不同年龄或进度的兄弟姐妹各练各的

**作为学生**  
**我想要** 每日驾驶指南的抽题来自家长为我配置的词池（在功能开启时）  
**以便** 练习内容与家长设定一致

---

## 2. 验收标准（Acceptance Criteria）

### 2.1 数据与归属

- [ ] 自定义词表**持久化在 `Student` 上**（或等价的一对一子表），**不**放在 `Parent` 上，以保证学生之间独立、并兼容未来一个家长多个学生。
- [ ] 当前仍为 **1 家长 1 学生** 时，设置页编辑的是**当前关联学生**的词表；未来多学生 UI 可扩展为「选择孩子再编辑」而不改存储语义。

### 2.2 词表内容与校验（与现有出题器兼容）

- [ ] 首期与 `0009` 已上线逻辑一致：会话为 **5 个两字词、共 10 字**（见 [`DRIVING_GUIDE_STEPS_PER_SESSION`](../../src/lib/driving-guide/constants.ts)）。自定义池应能支持该抽样：建议要求**至少 5 个不重复的两字词**；若业务允许从较小池中**有放回抽样**，需在 story 实现中明确并写清 UX（避免同日重复词过多）。
- [ ] 服务端对提交列表做**规范化**：去空白、去重、过滤不符合「两字中文词」规则的条目（规则可与现有 OCR/手写流程一致；若仅允许汉字，需明确正则或 Unicode 范围）。
- [ ] **空列表或未设置**：行为与今日一致，使用 **`DRIVING_GUIDE_WORDS` 默认词库**。

### 2.3 会话确定性与会话哈希

- [ ] `generateDrivingGuideSession`（或继任函数）使用的**词池**须包含「默认词库 vs 该生自定义」的分支；**同一 `studentId + dateKey + 词池内容版本`** 下抽题结果应与现网一样**可复现**（便于刷新页面一致）。
- [ ] `sessionHash` / `generatorId` 或 **generator 版本号** 在引入自定义词池后仍应**唯一标识当日题目组合**；若仅改词表不改版本会导致哈希碰撞，需**递增 `DRIVING_GUIDE_GENERATOR_VERSION` 或加入词池摘要**（如对排序后词表做短 hash 拼入 seed）。

### 2.4 家长端 UI

- [ ] 在 [`src/app/parent/settings/page.tsx`](../../src/app/parent/settings/page.tsx) 的「驾驶指南」区域内（或紧邻），增加**词表编辑**：例如多行文本、逗号/换行分隔，或标签输入；附**简短说明**（与 `0009` 一致：识字练习、不产生积分；**两字词、至少 N 个**等约束）。
- [ ] 保存时有**加载态与错误提示**（校验失败时明确告知缺多少词、哪条格式不对）。
- [ ] 视觉与现有家长端「简洁」风格一致；响应式遵循 PRD 断点。

### 2.5 API 与权限

- [ ] 新增或扩展家长 API：`GET` 返回当前学生的自定义词表（及可选：是否使用默认、池大小提示）；`PUT`/`PATCH` 更新词表，**仅** `requireParent` 且仅能操作**自己名下的 `Student`**。
- [ ] 学生端 `GET /api/student/driving-guide/session` **无需**把完整自定义词表下发给前端（除非现有实现需要）；抽题在服务端基于 `studentId` 读取词池即可（与现状一致）。

### 2.6 兼容与迁移

- [ ] 已有 `StudentDrivingGuideLog`、完成记录**不因本 story 失效**；若版本号变化，新会话 hash 与旧记录并存可接受（与现网版本迭代一致）。

---

## 3. 技术方案

### 3.1 修改点

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `prisma/schema.prisma` | 修改 | 在 `Student` 上新增字段存自定义词表（见 §3.2） |
| `prisma/migrations/*` | 新增 | 迁移 |
| `src/lib/driving-guide/session.ts` | 修改 | `generateDrivingGuideSession` 接收词池参数或内部按 `studentId` 读取；seed/hash 含词池版本 |
| `src/lib/driving-guide/constants.ts` | 修改 | 递增 `DRIVING_GUIDE_GENERATOR_VERSION` 或调整 `DRIVING_GUIDE_GENERATOR_ID` 策略（若需） |
| `src/app/api/student/driving-guide/session/route.ts` | 修改 | 生成会话前加载该生词池（Prisma），传入会话生成函数 |
| `src/app/api/parent/student/driving-guide-words/route.ts`（路径可微调） | 新增 | `GET`/`PUT` 词表 CRUD |
| `src/app/parent/settings/page.tsx` | 修改 | 词表编辑 UI + 调用 API |
| `src/contexts/DataContext.tsx`（可选） | 修改 | 若设置页复用全局拉取，可增加 refetch；否则页面内 `useEffect` 独立请求即可 |
| `src/lib/driving-guide/*`（新建小模块） | 新增 | 词表解析、校验、与默认池合并策略（保持单一职责） |

### 3.2 数据库设计

在 **`Student`** 上增加字段（推荐 JSON 数组，便于扩展为「带备注的词」等）：

```prisma
// Student 模型内新增（字段名可微调）
/// 驾驶指南自定义词语池；null 或空数组表示使用默认 src/config/driving-guide-words.ts
drivingGuideWordList Json? // string[]，如 ["讲话","土地",...]
```

- **索引**：一般不需要单独索引（按主键 `studentId` 查询）。
- **迁移**：`npx prisma migrate dev --name student_driving_guide_word_list`

若团队更偏好强类型行存，可改为 `StudentDrivingGuideWord` 一对多表；本 story 以 **JSON 数组** 为默认方案以降低实现成本。

### 3.3 前端设计

- **路由**：仍仅为 `/parent/settings`（无新页面时）；多孩时可为 `/parent/settings/driving-guide` 或子面板，本 story 以单页嵌入为主。
- **组件**：可在 `settings/page.tsx` 内联区块；若表单变复杂，再拆 `components/parent/DrivingGuideWordListEditor.tsx`。
- **交互**：加载默认展示服务端返回的列表；保存成功后 toast 或简短「已保存」；与「驾驶指南总开关」关系：**关闭开关时**仍可编辑词表或禁用编辑（二选一，建议**允许编辑**，仅学生端不开放练习）。

---

## 4. 依赖与风险

| 类型 | 说明 |
|------|------|
| 依赖 | `0009` 已上线的会话与 OCR 流程；`pinyin-pro` 逐字拼音对生僻字的表现 |
| 风险 | 家长输入非两字词或生僻字导致 OCR 误判率上升——可通过校验与文案提示缓解 |
| 风险 | 词池过小导致抽题重复或无法满足 5 词——**必须**在保存时或服务端生成会话前校验 |

---

## 5. 优先级（建议）

**P1**：家长可配、按学生存、会话抽题走自定义池、空则默认；校验与版本号/哈希正确。

---

## 6. 实现提示（非强制）

- 抽题逻辑复用现有 `mulberry32` + shuffle，仅将 `pool` 从静态 `DRIVING_GUIDE_WORDS` 换为「解析后的自定义数组」。
- 单元测试：同一 `studentId`、`dateKey`、固定词池 → 固定 `steps` 与 `sessionHash`。
