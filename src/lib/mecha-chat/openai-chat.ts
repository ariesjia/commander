import { resolveMechaChatOpenAI, chatCompletionsUrl } from "./config";

const MAX_HISTORY_MESSAGES = 24;

/** 语音消息在数据库中的占位文案（真实音频仅当次请求发给模型）。 */
export const MECHA_CHAT_VOICE_PLACEHOLDER = "[语音消息]";

/** OpenAI `input_audio.format` 字段，依供应商支持情况而定。 */
export function mimeTypeToInputAudioFormat(mimeType: string): string {
  const m = mimeType.toLowerCase();
  if (m.includes("wav")) return "wav";
  if (m.includes("webm")) return "webm";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("flac")) return "flac";
  return "webm";
}

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "USER" | "ASSISTANT";
  content: string;
};

type ApiContentPart =
  | { type: "text"; text: string }
  | { type: "input_audio"; input_audio: { data: string; format: string } };

type ApiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ApiContentPart[];
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

async function callChatCompletions(messages: ApiChatMessage[]): Promise<ChatCompletionResponse> {
  const { apiKey, baseUrl, chatModel } = resolveMechaChatOpenAI();
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY 或 MECHA_CHAT_API_KEY");
  }

  const body: Record<string, unknown> = {
    model: chatModel,
    messages,
    max_tokens: 800,
    temperature: 0.7,
  };

  const res = await fetch(chatCompletionsUrl(baseUrl), {
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
    throw new Error(`对话 API 错误 ${res.status}: ${raw.slice(0, 500)}`);
  }

  let outer: ChatCompletionResponse;
  try {
    outer = JSON.parse(raw) as ChatCompletionResponse;
  } catch {
    throw new Error("对话 API 返回非 JSON");
  }
  return outer;
}

function extractTextFromCompletion(outer: ChatCompletionResponse): string {
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
  return text.trim();
}

/** 语音直传模型，返回识别文本（不走 Whisper 接口）。 */
export async function transcribeMechaChatAudio(
  audio: { base64: string; format: string },
): Promise<string> {
  const messages: ApiChatMessage[] = [
    {
      role: "system",
      content:
        "你是语音识别助手。请将用户语音内容转写为简体中文文本，只输出转写结果，不要解释，不要加前缀。",
    },
    {
      role: "user",
      content: [
        { type: "text", text: "请转写这段语音。" },
        {
          type: "input_audio",
          input_audio: { data: audio.base64, format: audio.format },
        },
      ],
    },
  ];
  const outer = await callChatCompletions(messages);
  return extractTextFromCompletion(outer);
}

/** 非流式 chat completions；history 不含 system，由调用方单独传入 system。 */
export async function completeMechaChat(
  systemPrompt: string,
  history: ChatMessage[],
): Promise<string> {
  const trimmed = history.filter((m) => m.role !== "system").slice(-MAX_HISTORY_MESSAGES);
  const toApiRole = (r: ChatMessage["role"]): "user" | "assistant" =>
    r === "USER" || r === "user" ? "user" : "assistant";
  const messages: ApiChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...trimmed.map((m) => ({
      role: toApiRole(m.role),
      content: m.content,
    })),
  ];

  const outer = await callChatCompletions(messages);
  return extractTextFromCompletion(outer);
}
