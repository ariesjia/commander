# 机甲进化视频（学生端白底弹层播放）

> 为机甲配置可选的「进化 / 展示」短视频（素材为**白色背景**）；若已配置，学生端可在机甲库中观看。播放需在**浅色弹出层**内进行，避免白底视频在深色 UI 上发灰、裁切感强，弹层需精致、与现有学生端科技感协调。

---

## 1. 用户故事

**作为** 学生  
**我想要** 在机甲库里查看已领养机甲的进化（或展示）短视频  
**以便** 更有代入感地了解机甲形象与设定  

**作为** 运营 / 开发（配置方）  
**我想要** 在机甲维度配置可选的视频 URL（与现有机甲静态图同级、可空）  
**以便** 有素材的机甲能展示动画，无素材机甲行为不变  

---

## 2. 验收标准（Acceptance Criteria）

- [ ] `Mecha` 上增加可选字段（如 `evolutionVideoUrl`），空表示无机甲视频；现有机甲默认 `null`，行为与线上一致。
- [ ] 公开机甲详情 API（`GET /api/mechas/[slug]`）在 DTO 中带出该字段（有值才需前端展示入口，或始终返回 `null`）。
- [ ] 学生端 **机甲库**（`MechaLibraryPage` / 侧栏详情）中，仅当 `evolutionVideoUrl` 非空时显示入口（如「进化影像」「看视频」按钮或图标）。
- [ ] 点击后在**全屏或居中大弹层**内播放：弹层**主内容区为白色或近白**（如 `#f8fafc`～`#ffffff`），视频区域圆角、适度内边距，外层保留半透明遮罩与学生端主题边框/光效，整体**好看、不廉价**。
- [ ] 使用 `<video>`：`controls`、`playsInline`、`preload="metadata"`（或 `none` 省流量），关闭弹层时 `pause()` 并可选 `currentTime = 0`。
- [ ] 可访问性：关闭按钮可见；`Esc` 关闭；焦点管理合理（打开聚焦关闭钮或容器）；`aria-modal` / `role="dialog"`。
- [ ] 移动端（含 iPad / PWA）：视频可内联播放，不因弹层样式导致无法点击控制条。
- [ ] 视频资源为静态文件路径即可（如 `public/mecha/<slug>/animation.mp4`），与现有 `imageUrl` 约定一致；不在 story 内要求自建 CDN，但字段需支持绝对 URL 以备将来。

---

## 3. 技术方案

### 3.1 修改点（Modification Points）

| 文件/路径 | 修改类型 | 说明 |
|-----------|----------|------|
| `prisma/schema.prisma` | 修改 | `Mecha` 增加可选 `evolutionVideoUrl String?`（或命名 `introVideoUrl`，团队统一即可） |
| `prisma/migrations/*` | 新增 | `npx prisma migrate dev --name mecha_evolution_video` |
| `prisma/seed*.ts`（若存在机甲 seed） | 修改 | 示例：为已有 `animation.mp4` 的机甲写入 URL |
| `src/app/api/mechas/[slug]/route.ts` | 修改 | `MechaDetailDto` + 查询映射带上 `evolutionVideoUrl` |
| `src/lib/mecha-adoption.ts` | 修改 | `MechaDetail` 类型增加同名字段 |
| `src/hooks/useMecha.ts` | 可选 | 缓存归一化若依赖类型，随类型更新即可 |
| `src/components/mecha/MechaLibraryPage.tsx` | 修改 | 抽屉内条件展示入口；新开白底视频弹层组件或使用内联 `AnimatePresence` + Portal（与现有 `EvolutionModal` 层级参考 `z-[75]`～`z-[80]` 协调） |
| `src/components/mecha/MechaEvolutionVideoModal.tsx`（建议） | 新增 | 专用弹层：白底卡、视频槽、标题/机甲名、关闭、动效 |
| `docs/*-详细设计.md`（若有该机甲） | 可选 | 注明视频文件名与路径约定 |

**不在本 story 必做范围（可后续单开）**：管理后台表单上传视频；若当前仅 seed/手工改库即可满足，可在依赖中说明。

### 3.2 数据库设计（Database Design）

在 `Mecha` 上增加可空字符串字段，存**可公开访问的 URL**（相对站点根或绝对地址）。

```prisma
model Mecha {
  // ... 现有字段
  evolutionVideoUrl String?  // 例：/mecha/razor/animation.mp4
}
```

- **索引**：一般不需要单独索引（按 slug 查机甲已存在）。
- **迁移**：`npx prisma migrate dev --name mecha_evolution_video`

### 3.3 前端设计（Frontend Design）

- **涉及页面**：`src/app/student/mecha/page.tsx`（通过 `MechaLibraryPage`；若首页也需入口可另列，本 story 以机甲库为主）。
- **视觉（白底弹层）**  
  - **遮罩**：`bg-black/70`～`bg-black/80`，与学生端现有 `EvolutionModal` 一致或略柔。  
  - **内层卡片**：大面积 **白 / 冷白** 底，细边框（如 `border border-slate-200/80`）+ 轻阴影（`shadow-2xl`）+ 顶部或边角 **主题色细线/光晕**（`s-primary` 低不透明度）保持「机甲指挥官」科技感，避免纯白方块单调。  
  - **视频容器**：`rounded-xl`～`rounded-2xl`，内部 `video` `w-full max-h-[min(70dvh,520px)] object-contain`，保证白底视频边缘自然融入卡纸背景。  
  - **关闭**：右上角圆形/幽灵按钮，hover 有反馈。  
- **交互**：点击遮罩是否关闭：建议**仅按钮与 Esc 关闭**，避免误触暂停体验；若产品希望点遮罩关闭，需与视频点击区分（事件冒泡处理）。  
- **响应式**：小屏全宽留白 `p-3`～`p-4`；大屏 `max-w-3xl` 左右居中。  
- **与现有组件关系**：可复用 `createPortal`、`framer-motion` 与 `MechaLibraryPage` 中 `EvolutionModal` 的层级约定；视频弹层 z-index 应高于侧栏抽屉、低于或等于全局图片预览（若有冲突，统一文档说明）。

---

## 4. 依赖与风险

- **依赖**：机甲静态资源目录规范（`public/mecha/<slug>/`）；已有 `animation.mp4` 的机甲可直接填路径验证。
- **风险**：  
  - **大文件流量**：仅按需加载 `metadata` 或点击后再 `load`；不在列表页预加载视频。  
  - **iOS 自动播放**：带 `controls` 的用户点击播放一般可接受；无需静音自动播。  
  - **格式**：优先 MP4（H.264）；若素材为 WebM，需说明浏览器支持范围。

---

## 5. 优先级（可选）

- [ ] P1 重要（内容展示与品牌感）
