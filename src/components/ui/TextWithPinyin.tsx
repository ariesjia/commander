"use client";

import { toPinyinHtml } from "@/lib/pinyin";

interface TextWithPinyinProps {
  text: string;
  showPinyin: boolean;
  /** 是否显示声调（默认 true，如 hàn） */
  withTone?: boolean;
  className?: string;
}

/**
 * 当 showPinyin 为 true 时，在文字上方显示拼音注音
 */
export function TextWithPinyin({ text, showPinyin, withTone = true, className = "" }: TextWithPinyinProps) {
  if (!showPinyin) {
    return <span className={className}>{text}</span>;
  }

  const html = toPinyinHtml(text, withTone);
  return (
    <span
      className={`text-with-pinyin inline-block max-w-full align-top ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
