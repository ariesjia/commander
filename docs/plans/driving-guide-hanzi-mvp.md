# 驾驶指南 (0009) MVP 实施计划

> 对应需求：[docs/stories/0009-student-driving-guide-hanzi.md](../stories/0009-student-driving-guide-hanzi.md)  
> **修订**：MVP 判题采用 **Tesseract OCR** 做端到端测试（已知对手写少儿字迹准确率有限，仅作实验/基线）。

---

## MVP 判题：Tesseract

### 目标

- 学生提交**手写区导出的位图**（如 PNG base64）至服务端；服务端用 **Tesseract** 识别为文本，与当前步骤**目标词语**做规范化比对（去空格、全半角、Unicode 正规化），判定通过/失败并返回 §0009 的鼓励/提示文案。

### 运行时选型（实现时二选一）

| 方案 | 说明 |
|------|------|
| **A. 系统 `tesseract` CLI** | 部署环境需安装 `tesseract` + `chi_sim` tessdata；Node 用 `child_process`/`execFile` 调起，传入临时文件路径。适合 Docker/CI 可控镜像。 |
| **B. `tesseract.js`** | 纯 JS/WASM，可随应用部署；包体较大，但无需系统依赖。适合 Vercel 等受限环境。 |

首期可优先 **B** 以降低运维摩擦；若性能不足再换 **A**。

### 语言与参数

- 语言包：**`chi_sim`**（简体中文）。
- 输入图：Canvas `toDataURL` → Buffer；建议 **白底、字区尽量大、适度 padding**（可在客户端导出前 `fillRect` 白底、裁剪包围盒）。
- Tesseract 配置：可尝试 `PSM` 单块文本/单行（如 `--psm 7` 或 `8`）做对比实验；MVP 先固定一组参数并写死，后续再调。

### 比对逻辑

1. OCR 输出字符串 `s`：`trim`，`NFKC`，去除空白与常见标点。
2. 期望词 `expected`：同样规范化。
3. **通过条件（MVP）**：`s === expected` 或（可选）**包含关系** `s.includes(expected)` 若 OCR 多识别周边噪声——产品需定；建议 MVP 先 **严格相等**，误判高再放宽。
4. **失败**：走 `FAILURE_HINT_LINES`；可附带 `rawOcr: s` 仅在 **开发环境** 日志，生产不落原文。

### 环境开关

- 建议 `DRIVING_GUIDE_OCR=tesseract` | `off`：便于本地无 OCR 时降级为「仅完成流程/自评」（若保留）。

### 风险（与 0009 文档一致）

- Tesseract 对**手写**尤其是儿童笔迹**误判率高**；本阶段定位为 **MVP 测试与基线**，后续可换云手写 API 或笔顺方案而不改接口形状（保留 `evaluateHandwriting(image)→text` 抽象）。

---

## 其余任务（与初版计划一致，摘要）

1. **数据**：`Parent.drivingGuideEnabled`、`StudentDrivingGuideLog`、迁移。
2. **词库**：[src/config/driving-guide-words.ts](../../src/config/driving-guide-words.ts)（§2.4 种子）；`session` 生成 5 词 / 10 字 + `sessionHash`。
3. **API**：`GET session`、`POST complete`（或分步 `POST step` 携带图片）；**判题函数内调用 Tesseract**。
4. **Profile / dashboard / settings / DataContext**：与机甲维修开关模式一致。
5. **UI**：`/student/driving-guide`、`HandwritingCanvas`、无 TTS、鼓励/提示 copy。
6. **主页入口**：维修下方 + `drivingGuide` 状态。

---

## 依赖与文档

- 若使用 `tesseract.js`：在 [package.json](../../package.json) 增加依赖并在 README/部署说明中注明 **WASM 包大小**。
- 若使用系统 CLI：Dockerfile / 部署文档中安装 `tesseract-ocr` 与 `tesseract-ocr-chi-sim`。
