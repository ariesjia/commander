import { resolveMechaChatTranscribe, audioTranscriptionsUrl } from "./config";

/** 单条录音最大体积（base64 解码后） */
export const MECHA_CHAT_MAX_AUDIO_BYTES = 2 * 1024 * 1024;

/**
 * OpenAI 兼容 audio/transcriptions（Whisper）。
 */
export async function transcribeAudioBytes(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  if (buffer.length > MECHA_CHAT_MAX_AUDIO_BYTES) {
    throw new Error("录音过大，请缩短后再试");
  }

  const { apiKey, baseUrl, transcribeModel } = resolveMechaChatTranscribe();
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY 或 MECHA_CHAT_API_KEY");
  }

  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType || "audio/webm" });
  form.append("file", blob, filename);
  form.append("model", transcribeModel);

  const res = await fetch(audioTranscriptionsUrl(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
    signal: AbortSignal.timeout(55_000),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`语音转写错误 ${res.status}: ${raw.slice(0, 500)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as { text?: string };
  } catch {
    throw new Error("转写 API 返回非 JSON");
  }

  const text = typeof parsed === "object" && parsed && "text" in parsed
    ? String((parsed as { text?: string }).text ?? "")
    : "";

  return text.trim();
}
