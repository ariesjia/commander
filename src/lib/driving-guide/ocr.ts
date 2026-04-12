/**
 * 手写截图识别：OpenAI 兼容 Chat Completions（vision / image_url），模型输出 JSON
 */

const DEFAULT_VISION_BASE = "https://api.openai.com/v1";
const DEFAULT_VISION_MODEL = "gpt-4o-mini";

export type DrivingGuideVisionResult = {
  /** 模型判断是否与目标词一致 */
  match: boolean;
  /** match 为 false 时表示模型读到的字；为 true 时通常为空 */
  recognized: string;
};

export function normalizeOcrText(s: string): string {
  return s
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[，。、""''「」]/g, "");
}

export function ocrMatchesTarget(ocrRaw: string, expectedWord: string): boolean {
  const o = normalizeOcrText(ocrRaw);
  const e = normalizeOcrText(expectedWord);
  if (!e) return false;
  if (o === e) return true;
  if (o.includes(e)) return true;
  return false;
}

/** 将 data URL 或纯 base64 转为 Buffer */
export function parseDataUrlToBuffer(dataUrlOrBase64: string): Buffer {
  const s = dataUrlOrBase64.trim();
  if (s.startsWith("data:")) {
    const comma = s.indexOf(",");
    const b64 = comma >= 0 ? s.slice(comma + 1) : s;
    return Buffer.from(b64, "base64");
  }
  return Buffer.from(s, "base64");
}

function bufferToImageDataUrl(buf: Buffer): string {
  let mime = "image/png";
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    mime = "image/jpeg";
  } else if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    mime = "image/png";
  } else if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    mime = "image/webp";
  }
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function stripVisionModelNoise(s: string): string {
  return s
    .trim()
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .trim();
}

/** 从模型回复中截取第一个完整 JSON 对象子串 */
function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function parseDrivingGuideVisionJson(text: string): DrivingGuideVisionResult {
  const cleaned = stripVisionModelNoise(text);
  const jsonStr = extractFirstJsonObject(cleaned) ?? cleaned;
  let obj: unknown;
  try {
    obj = JSON.parse(jsonStr);
  } catch {
    throw new Error("模型未返回合法 JSON");
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("JSON 格式无效");
  }
  const rec = obj as { match?: unknown; recognized?: unknown };
  if (typeof rec.match !== "boolean") {
    throw new Error("JSON 缺少布尔字段 match");
  }
  const recognized =
    rec.recognized === undefined || rec.recognized === null
      ? ""
      : String(rec.recognized).trim();
  return {
    match: rec.match,
    recognized: normalizeOcrText(recognized),
  };
}

function visionEndpoint(base: string): string {
  const b = base.replace(/\/$/, "");
  return `${b}/chat/completions`;
}

function resolveVisionConfig(): {
  apiKey: string;
  baseUrl: string;
  model: string;
} {
  const apiKey =
    process.env.DRIVING_GUIDE_VISION_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";
  const baseUrl = (
    process.env.DRIVING_GUIDE_VISION_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    DEFAULT_VISION_BASE
  ).replace(/\/$/, "");
  const model =
    process.env.DRIVING_GUIDE_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;
  return { apiKey, baseUrl, model };
}

function buildVisionPrompt(expectedWord: string): string {
  return [
    "你将看到一张学生手写简体中文的图片。",
    `本题要求写出的词语是：「${expectedWord}」。`,
    "",
    "请判断图中手写是否与该词语一致（允许轻微连笔、倾斜；语义上应为目标词）。",
    "",
    "只输出一个 JSON 对象，不要 markdown、不要前后说明。格式：",
    '- 若一致：{"match":true}',
    '- 若不一致：{"match":false,"recognized":"你从图中读到的简体中文"}；recognized 仅含识别出的字，不要解释。',
    '- 若完全无法辨认：{"match":false,"recognized":""}',
  ].join("\n");
}

/**
 * 将手写图与「目标词」一并交给多模态模型，解析其返回的 JSON（match / recognized）。
 * `DRIVING_GUIDE_OCR_SKIP=1` 时视为通过（match: true，recognized 空）。
 *
 * 环境变量见仓库 `.env.example`。若兼容接口不支持 `response_format`，可设 `DRIVING_GUIDE_VISION_NO_JSON_MODE=1`。
 */
export async function evaluateHandwritingVision(
  imageBuffer: Buffer,
  expectedWord: string,
): Promise<DrivingGuideVisionResult> {
  if (process.env.DRIVING_GUIDE_OCR_SKIP === "1") {
    return { match: true, recognized: "" };
  }
  const { apiKey, baseUrl, model } = resolveVisionConfig();
  if (!apiKey) {
    throw new Error(
      "缺少视觉识别密钥：请设置 DRIVING_GUIDE_VISION_API_KEY 或 OPENAI_API_KEY",
    );
  }

  const dataUrl = bufferToImageDataUrl(imageBuffer);
  const prompt = buildVisionPrompt(expectedWord);

  const useJsonObjectMode =
    process.env.DRIVING_GUIDE_VISION_NO_JSON_MODE !== "1";

  const body: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    max_tokens: 128,
    temperature: 0,
  };
  if (useJsonObjectMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(visionEndpoint(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(55_000),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(
      `视觉 API 错误 ${res.status}: ${raw.slice(0, 500)}`,
    );
  }

  let outer: unknown;
  try {
    outer = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("视觉 API 返回非 JSON");
  }

  const choices = (outer as { choices?: unknown }).choices;
  const first =
    Array.isArray(choices) && choices[0] && typeof choices[0] === "object"
      ? (choices[0] as { message?: { content?: unknown } }).message
      : undefined;
  const content = first?.content;
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .map((part) => {
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("");
  }

  return parseDrivingGuideVisionJson(text);
}
