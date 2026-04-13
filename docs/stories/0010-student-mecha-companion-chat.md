# 学生与机甲对话（语音交互 · 世界观系统提示 · 会话刷新与历史）

> **概述**：在学生端提供与**当前主机甲**的 AI 对话能力。AI 在系统提示词中扮演 **MotiMech 家庭激励体系中的专属机甲**，并注入**完整机甲背景**（介绍、当前形态等级、已解锁/未解锁里程碑技能等），以**激励学生**为主要对话目标。学生以**录音**为主进行输入；机甲回复支持**一键朗读**（TTS）。支持**新建会话**（默认「换一局」式刷新上下文）与**会话/消息历史**查阅。

> **关联**：`docs/PRD-机甲指挥官-学生游戏化激励系统.md`（产品世界观与边界）；机甲配置与技能见 `prisma/schema.prisma` 的 `Mecha` / `MechaLevel` / `MechaSkill`、`docs/stories/0004-mecha-skills.md`；学生主机甲与积分见 `Student` / `StudentMecha`、`src/app/api/student/profile/route.ts`；浏览器朗读可复用 `src/hooks/useReadAloud.ts`（与机甲维修、驾驶指南 TTS 一致）。

---

## 1. 用户故事

**作为** 学生  
**我想要** 用语音和我的机甲聊天，并让机甲像「家里的激励伙伴」一样鼓励我、回答我  
**以便** 更有代入感地坚持任务与养成

**作为** 家长（可选后续）  
**我想要** 能开关该功能或限制使用场景  
**以便** 控制屏幕时间与对话成本

**作为** 开发  
**我想要** 对话上下文与机甲数据来自同一套 `Mecha` / `StudentMecha` 事实源  
**以便** 提示词与界面展示不漂移、可测试

---

## 2. 验收标准（Acceptance Criteria）

- [ ] 学生端有独立入口（如「与机甲通话」/「机甲对话」）进入对话页；无主机甲或未领养时给出引导（与现有领养流程一致）。
- [ ] 对话对象固定为**当前主机甲**（`Student.primaryMechaId` → `mechaSlug`）；切换主机甲后新消息基于新机甲上下文（见 §3.4）。
- [ ] **默认可「新建会话」**：一键清空当前线程上下文，开始新 `session`（旧会话保留在历史列表中，见数据库设计）。
- [ ] **历史**：可查看本会话消息列表；可选查看**近期会话列表**（标题/时间/首条摘要），点入加载该会话消息（只读或继续发消息按产品定——建议**仅继续当前会话**，历史只读，避免复杂分支）。
- [ ] 学生输入以**录音**为主：按住或点击录音 → 结束 → 上传/识别为文本再送 LLM；不支持录音时降级为**文本输入**（可选）或明确提示。
- [ ] 每条**机甲回复**旁有「朗读」按钮，使用中文 TTS 播报该条内容（复用 `useReadAloud` 或等价封装，与全站语速 `SPEECH_SYNTHESIS_RATE` 一致）。
- [ ] 服务端组装 **system prompt**：包含 **世界观摘要**（见 §3.5）+ **当前机甲结构化事实**（名称、`intro`、当前等级数值与形态名、`points`、技能列表含解锁状态与未解锁的解锁等级）。
- [ ] AI **行为约束**：语气积极、鼓励完成任务与坚持习惯；不涉及医疗诊断、不输出有害内容；不假装能操作 App 内真实按钮（可声明为「陪伴与鼓励」）。
- [ ] 使用与项目一致的 **OpenAI 兼容** 对话接口（可与驾驶指南共用 `OPENAI_API_KEY` / `OPENAI_BASE_URL`，独立模型 env 如 `MECHA_CHAT_MODEL`）。
- [ ] API 经 `requireStudent` 鉴权；不暴露其他家庭数据。

---

## 3. 技术方案

### 3.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `prisma/schema.prisma` | 修改 | 新增 `MechaChatSession`、`MechaChatMessage`（及与 `Student` 关系）；可选 `Parent.mechaChatEnabled` |
| `prisma/migrations/*` | 新增 | 迁移 |
| `src/lib/mecha-chat/system-prompt.ts`（建议） | 新增 | 从 PRD/常量与世界观模板拼装 system 段；从 DB + 计算机甲当前等级与技能解锁 |
| `src/lib/mecha-chat/context.ts`（建议） | 新增 | 加载 `Mecha` + `StudentMecha` + skills/levels 为 prompt 片段 |
| `src/app/api/student/mecha-chat/sessions/route.ts` | 新增 | `GET` 列表 / `POST` 创建会话 |
| `src/app/api/student/mecha-chat/sessions/[sessionId]/messages/route.ts` | 新增 | `GET` 消息历史；`POST` 用户消息（文本或音频）→ 可选转写 → 调 LLM → 存 assistant 消息 |
| `src/app/api/student/mecha-chat/transcribe/route.ts` | 可选 新增 | 若 ASR 放服务端：接收音频 → Whisper 兼容接口 |
| `src/app/student/mecha-chat/page.tsx`（或 `companion`） | 新增 | 对话 UI：消息列表、录音、新建会话、历史入口、朗读 |
| `src/components/mecha-chat/*` | 新增 | 气泡、录音条、会话列表抽屉等 |
| `src/contexts/DataContext.tsx` / `src/types/index.ts` | 可选 修改 | 若家长开关：拉取 profile/dashboard 中的 `mechaChat` |
| `src/app/student/page.tsx` | 修改 | 入口按钮/卡片（与维修、驾驶指南并列，受开关控制） |
| `src/app/api/parent/settings/route.ts` | 可选 修改 | `mechaChatEnabled` |
| `.env.example` | 修改 | `MECHA_CHAT_MODEL`、ASR 相关若独立 |

**现有可复用**

- 鉴权：`src/lib/api-auth.ts`（`requireStudent`、`getStudentId`）
- 机甲详情：`GET /api/mechas/[slug]`（`MechaDetailDto`）、`GET /api/mechas/[slug]/level?points=` 或本地用 `pointsToNumber` + levels 数组计算当前阶（与 `src/app/api/mechas/[slug]/level/route.ts` 一致）
- 主机甲：`prisma.student.findUnique` + `primaryMecha` / `studentMechas`

### 3.2 数据库设计（Database Design）

持久化会话与消息，便于「历史」与审计；新建会话即新行。

```prisma
/// 学生与主机甲的 AI 对话会话（换会话 = 新行）
model MechaChatSession {
  id         String   @id @default(cuid())
  studentId  String
  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  /// 创建时会话锚定的主机甲 slug（若之后切换主机甲，新会话用新机甲）
  mechaSlug  String
  title      String?  // 可选：首条用户话摘要或「与玄甲的对话 3/29」
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  messages MechaChatMessage[]

  @@index([studentId, updatedAt])
}

enum MechaChatRole {
  USER
  ASSISTANT
}

model MechaChatMessage {
  id        String         @id @default(cuid())
  sessionId String
  session   MechaChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      MechaChatRole
  content   String         @db.Text
  createdAt DateTime       @default(now())

  @@index([sessionId, createdAt])
}
```

`Student` 上增加：`mechaChatSessions MechaChatSession[]`（若 Prisma 需要反向关系）。

迁移：`npx prisma migrate dev --name student_mecha_chat`

**可选**：`Parent.mechaChatEnabled Boolean @default(true)`，与 `drivingGuideEnabled` 同构。

### 3.3 前端设计（Frontend Design）

- **路由**：`src/app/student/mecha-chat/page.tsx`（或 `/student/companion`），学生端科技卡通风格，与 `driving-guide`、`maintenance-math` 一致（深色底、主色条）。
- **布局**：
  - 顶栏：标题（机甲名 + 「对话」）、**新建会话**、**历史**（抽屉或侧栏：近期 `MechaChatSession` 列表）。
  - 主体：消息列表（用户右、机甲左；机甲头像可用当前等级 `imageUrl`）。
  - 输入区：**大颗录音按钮**（按下录音、松开结束；或点击开始/结束）；辅助：**文本框**可选。
  - 每条机甲消息：**朗读**图标按钮，调用 `useReadAloud.speakNow(text)`。
- **状态**：当前 `sessionId`；`POST` 创建会话后本地保存；新建会话调用 `POST /sessions` 再清空列表并从空开始。
- **响应式**：竖屏单手友好，录音区拇指可达；与 PRD 学生端断点一致。

### 3.4 主机甲切换

若学生在其他页更换主机甲：建议 **提示「新机甲将在下一次新建会话时生效」**，或进入对话页时若检测到 `primaryMecha` 与当前 `session.mechaSlug` 不一致，**引导新建会话**。

### 3.5 系统提示词与世界观（System Prompt）

**静态段（可放 `src/lib/mecha-chat/worldview.ts`）** 应概括 PRD 中的 MotiMech：

- 产品名 MotiMech；家长配置任务与奖励；学生完成任务获得积分；积分驱动机甲成长；你是该学生领养的那台机甲的**人格化声音**。
- 目标：鼓励孩子完成任务、诚实面对困难、小步前进；不说教、不贬低；不涉及真实世界危险操作。
- 边界：不能替家长改任务/发积分；不能提供医疗/心理咨询替代。

**动态段（每请求生成）** 使用结构化事实，避免模型编造：

| 字段 | 来源 |
|------|------|
| 学生昵称 | `Student.nickname` |
| 机甲名称、description、intro | `Mecha` |
| 当前积分、当前等级索引/形态名 | `StudentMecha.points` + `MechaLevel.threshold` |
| 技能列表 | `MechaSkill`：标注 `已解锁` / `未解锁（需形态等级 ≥ unlockLevel）` |

可选附加：`streakDays`、`balance` 一句话激励（注意勿泄露敏感家长数据）。

**用户消息**：仅发送本轮用户文本（及可选最近 N 条摘要进多轮）；**system 每次附带**，避免会话漂移时丢设定。

### 3.6 语音链路（ASR）

| 方案 | 说明 |
|------|------|
| **A. 服务端 Whisper 兼容** | `POST` 音频 → OpenAI `audio/transcriptions` 或兼容网关；质量稳，有费用 |
| **B. 浏览器 Web Speech API** | `SpeechRecognition`，零服务端成本，兼容性与方言参差；可作 MVP 降级 |
| **建议** | MVP：**服务端转写**（与现有 OpenAI 密钥一致）；无麦克风时允许键盘 |

---

## 4. 依赖与风险

- **依赖**：OpenAI 兼容 API（对话 + 可选转写）；与 `0009` 驾驶指南共用密钥管理习惯。
- **风险**：
  - **儿童安全与合规**：建议服务端关键词过滤或轻量 moderation；日志不落敏感家庭细节。
  - **成本**：长历史 × 多轮会涨 token；可限制每会话消息条数、system 压缩为 bullet。
  - **录音权限**：HTTPS + 用户授权；首次进入说明用途。
  - **iOS Safari**：语音识别与 TTS 行为需真机测。

---

## 5. 优先级（可选）

- [ ] P0：单会话对话 + system prompt 注入 + 录音→文本→回复 + 朗读 + 新建会话
- [ ] P1：会话列表与历史查看、家长开关
- [ ] P2：流式输出（SSE）、机甲立绘表情随情绪（非本 story 必需）

---

## 6. 参考代码路径速查

| 用途 | 路径 |
|------|------|
| 学生 profile / 主机甲 | `src/app/api/student/profile/route.ts` |
| 机甲详情 API | `src/app/api/mechas/[slug]/route.ts` |
| 等级计算 | `src/app/api/mechas/[slug]/level/route.ts` |
| TTS Hook | `src/hooks/useReadAloud.ts` |
| OpenAI 兼容调用范例 | `src/lib/driving-guide/ocr.ts`（fetch 模式可类比到 chat/completions） |
