import { html } from "pinyin-pro";

/**
 * 将中文转换为带拼音注音的 HTML（用于 ruby 显示）
 * @param text 中文文本
 * @param withTone 是否带声调（默认 true，如 hàn）
 */
export function toPinyinHtml(text: string, withTone = true): string {
  if (!text || typeof text !== "string") return "";
  try {
    return html(text, { toneType: withTone ? "symbol" : "none" });
  } catch {
    return text;
  }
}
