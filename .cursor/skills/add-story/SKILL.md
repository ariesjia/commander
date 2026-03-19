---
name: add-story
description: Creates development stories in docs/stories/ from user ideas. Refines requirements, queries codebase, produces technical plan with modification points, database design, and frontend design. Use when adding a story, 添加 story, 新增开发需求, or describing upcoming development work.
---

# 添加 Story

将用户想法细化为开发需求文档，存入 `docs/stories/`。Story 需包含：需求细化、技术方案、修改点、数据库设计、前端设计。

## 工作流程

### Phase 1: 收集与细化需求

1. **获取用户想法**：用户描述功能或需求的大致想法
2. **细化需求**：
   - 明确用户故事（作为谁，想要什么，以便达成什么）
   - 拆解为可验收的要点（Acceptance Criteria）
   - 识别与现有 PRD、模块的关联（参考 `docs/PRD-机甲指挥官-学生游戏化激励系统.md`）
3. **命名**：提炼简短英文名（小写+连字符），如 `student-streak-badge`、`parent-task-bulk-edit`

### Phase 2: 查询代码仓库

在细化需求后，**必须**搜索代码库以落地技术方案：

| 查询目标 | 搜索方式 | 参考路径 |
|----------|----------|----------|
| 相关 API / 路由 | 语义搜索「XX 功能如何实现」「XX API」 | `src/app/api/` |
| 相关页面与组件 | 语义搜索「XX 页面」「XX 组件」 | `src/app/`、`src/components/` |
| 数据模型与 Schema | 查看 Prisma schema | `prisma/schema.prisma` |
| 现有业务逻辑 | 语义搜索「XX 逻辑」「XX 流程」 | `src/` |
| 上下文与状态 | 搜索 DataContext、AuthContext 等 | `src/contexts/` |

**输出**：列出与本 story 相关的现有文件与逻辑，作为「修改点」的依据。

### Phase 3: 技术方案设计

基于 Phase 2 的查询结果，撰写以下三部分：

#### 3.1 修改点（Modification Points）

```markdown
### 修改点

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| src/app/xxx/route.ts | 新增/修改 | ... |
| src/components/xxx.tsx | 修改 | ... |
| prisma/schema.prisma | 修改 | ... |
```

- **修改类型**：新增 / 修改 / 删除
- **说明**：简要描述改动内容

#### 3.2 数据库设计（Database Design）

若涉及数据持久化：

- 参考 `prisma/schema.prisma` 现有模型
- 列出新增/修改的 model、enum、字段
- 说明关联关系与索引
- 若有迁移，注明 `npx prisma migrate dev --name xxx`

**示例**：

```prisma
// 新增或修改
model NewFeature {
  id        String   @id @default(cuid())
  studentId String
  student   Student  @relation(...)
  ...
}
```

#### 3.3 前端设计（Frontend Design）

- **页面**：涉及哪些路由（`app/parent/xxx`、`app/student/xxx`）
- **组件**：新增/复用的组件，与现有 `components/` 的对应关系
- **交互**：关键流程、状态变化、响应式断点（参考 PRD 的响应式规范）
- **视觉**：与家长端/学生端风格的一致性（简洁 vs 科技卡通）

### Phase 4: 确定编号并写入

1. **确定编号**：列出 `docs/stories/` 下已有文件，取最大编号 +1
   ```bash
   ls docs/stories/
   # 若无文件则从 0001 开始
   ```
2. **文件名**：`000x-<name>.md`，如 `0001-student-streak-badge.md`
3. **写入**：按 [template.md](template.md) 结构创建文档

### Phase 5: 确认与执行

1. 将完整 story 内容展示给用户确认
2. 用户确认后，创建 `docs/stories/000x-<name>.md`
3. 可选：在 `docs/README.md` 的「开发需求」章节追加该 story 链接（若存在该章节）

## Story 文档结构

参考 [template.md](template.md)，包含：

- 标题与概述
- 用户故事与验收标准
- 技术方案（修改点、数据库、前端）
- 依赖与风险
- 优先级（可选）

## 参考

- PRD：`docs/PRD-机甲指挥官-学生游戏化激励系统.md`
- 数据库：`prisma/schema.prisma`
- API 结构：`src/app/api/`
- 页面与组件：`src/app/`、`src/components/`
- 文档目录：`docs/README.md`
