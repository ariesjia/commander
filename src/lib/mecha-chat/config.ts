const DEFAULT_OPENAI_BASE = "https://api.openai.com/v1";

export type MechaChatOpenAIConfig = {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
};

/** 单条语音最大体积（base64 解码后） */
export const MECHA_CHAT_MAX_AUDIO_BYTES = 2 * 1024 * 1024;

/** 与驾驶指南共用 OPENAI_API_KEY / OPENAI_BASE_URL；可单独覆盖 MECHA_CHAT_* */
export function resolveMechaChatOpenAI(): MechaChatOpenAIConfig {
  const apiKey =
    process.env.MECHA_CHAT_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";
  const baseUrl = (
    process.env.MECHA_CHAT_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    DEFAULT_OPENAI_BASE
  ).replace(/\/$/, "");
  const chatModel =
    process.env.MECHA_CHAT_MODEL?.trim() ||
    "gpt-4o-mini";
  return { apiKey, baseUrl, chatModel };
}

export function chatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}
