import {
  resolveMechaChatOpenAI,
  chatCompletionsUrl,
} from "./config";

const MAX_HISTORY_MESSAGES = 24;

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "USER" | "ASSISTANT";
  content: string;
};

/**
 * 非流式 chat completions；history 不含 system，由调用方单独传入 system。
 */
export async function completeMechaChat(
  systemPrompt: string,
  history: ChatMessage[],
): Promise<string> {
  const { apiKey, baseUrl, chatModel } = resolveMechaChatOpenAI();
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY 或 MECHA_CHAT_API_KEY");
  }

  const trimmed = history.filter((m) => m.role !== "system").slice(-MAX_HISTORY_MESSAGES);

  const toApiRole = (r: ChatMessage["role"]): "user" | "assistant" =>
    r === "USER" || r === "user" ? "user" : "assistant";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...trimmed.map((m) => ({
      role: toApiRole(m.role),
      content: m.content,
    })),
  ];

  const res = await fetch(chatCompletionsUrl(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: chatModel,
      messages,
      max_tokens: 800,
      temperature: 0.7,
    }),
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
