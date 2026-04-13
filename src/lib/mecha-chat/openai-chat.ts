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

export type CompleteMechaChatOptions = {
  /**
   * 本轮 user 为语音：把原始音频作为 input_audio 发给 chat/completions（不经 Whisper）。
   * history 中对应 user 行为占位文案 {@link MECHA_CHAT_VOICE_PLACEHOLDER}。
   */
  lastUserInputAudio?: { base64: string; format: string };
};

/**
 * 非流式 chat completions；history 不含 system，由调用方单独传入 system。
 * 语音轮次需在 options 中传入 lastUserInputAudio，且需使用支持 input_audio 的模型（如 gpt-audio 等，依供应商文档）。
 */
export async function completeMechaChat(
  systemPrompt: string,
  history: ChatMessage[],
  options?: CompleteMechaChatOptions,
): Promise<string> {
  const { apiKey, baseUrl, chatModel } = resolveMechaChatOpenAI();
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY 或 MECHA_CHAT_API_KEY");
  }

  const trimmed = history.filter((m) => m.role !== "system").slice(-MAX_HISTORY_MESSAGES);

  const toApiRole = (r: ChatMessage["role"]): "user" | "assistant" =>
    r === "USER" || r === "user" ? "user" : "assistant";

  const voiceHint =
    "学生发来一段语音，请听懂内容后，以主机甲同伴的身份自然回复；若听不清可礼貌请对方再说一次。";

  const mapped: ApiChatMessage[] = trimmed.map((m, idx) => {
    const isLast = idx === trimmed.length - 1;
    const isUser = toApiRole(m.role) === "user";
    if (
      options?.lastUserInputAudio &&
      isLast &&
      isUser &&
      m.content === MECHA_CHAT_VOICE_PLACEHOLDER
    ) {
      return {
        role: "user",
        content: [
          { type: "text", text: voiceHint },
          {
            type: "input_audio",
            input_audio: {
              data: options.lastUserInputAudio.base64,
              format: options.lastUserInputAudio.format,
            },
          },
        ],
      };
    }
    return {
      role: toApiRole(m.role),
      content: m.content,
    };
  });

  const messages: ApiChatMessage[] = [{ role: "system", content: systemPrompt }, ...mapped];

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

  let outer: unknown;
  try {
    outer = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("对话 API 返回非 JSON");
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

  return text.trim();
}
