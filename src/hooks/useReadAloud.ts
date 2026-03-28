"use client";

import { useCallback, useEffect, useState } from "react";
import { SPEECH_SYNTHESIS_RATE } from "@/lib/speech-config";

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
      utterance.rate = SPEECH_SYNTHESIS_RATE;
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

  /** 取消当前朗读并立即读新内容（换题、机甲库连续播报等场景） */
  const speakNow = useCallback(
    (
      text: string,
      options?: {
        onStart?: () => void;
        onEnd?: () => void;
      },
    ) => {
      if (!speechSupported || !text.trim()) return;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = SPEECH_SYNTHESIS_RATE;
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang === "zh-CN") ?? voices.find((v) => v.lang.startsWith("zh"));
      if (zhVoice) utterance.voice = zhVoice;
      utterance.onstart = () => {
        setIsSpeaking(true);
        options?.onStart?.();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };
      window.setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 0);
    },
    [speechSupported],
  );

  return { speechSupported, isSpeaking, speak, speakNow, cancel };
}
