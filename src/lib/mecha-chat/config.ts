const DEFAULT_OPENAI_BASE = "https://api.openai.com/v1";

export type MechaChatOpenAIConfig = {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  transcribeModel: string;
};

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
    process.env.MECHA_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const transcribeModel =
    process.env.MECHA_CHAT_TRANSCRIBE_MODEL?.trim() || "whisper-1";
  return { apiKey, baseUrl, chatModel, transcribeModel };
}

/**
 * 语音转写专用 endpoint。多数「仅转发 chat」的网关没有 /audio/transcriptions，会 404；
 * 此时设 MECHA_CHAT_TRANSCRIBE_BASE_URL=https://api.openai.com/v1（或支持 Whisper 的地址）。
 * 可选 MECHA_CHAT_TRANSCRIBE_API_KEY，否则与对话共用 Key。
 */
export function resolveMechaChatTranscribe(): Pick<
  MechaChatOpenAIConfig,
  "apiKey" | "baseUrl" | "transcribeModel"
> {
  const main = resolveMechaChatOpenAI();
  const apiKey =
    process.env.MECHA_CHAT_TRANSCRIBE_API_KEY?.trim() || main.apiKey;
  const baseUrl = (
    process.env.MECHA_CHAT_TRANSCRIBE_BASE_URL?.trim() || main.baseUrl
  ).replace(/\/$/, "");
  return {
    apiKey,
    baseUrl,
    transcribeModel: main.transcribeModel,
  };
}

export function chatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

export function audioTranscriptionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/audio/transcriptions`;
}
