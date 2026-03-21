"use client";

import { useCallback, useEffect, useState } from "react";

function getSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

/**
 * 浏览器 TTS：与机甲库一致选用 zh-CN voice。
 */
export function useReadAloud() {
  const [speechSupported] = useState(getSpeechSupported);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!speechSupported) return;
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [speechSupported]);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [speechSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!speechSupported || !text.trim()) return;
      if (isSpeaking) {
        cancel();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 1;
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang === "zh-CN") ?? voices.find((v) => v.lang.startsWith("zh"));
      if (zhVoice) utterance.voice = zhVoice;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    },
    [speechSupported, isSpeaking, cancel],
  );

  return { speechSupported, isSpeaking, speak, cancel };
}
