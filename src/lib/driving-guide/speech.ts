/**
 * 驾驶指南开场：浏览器语音合成（需用户点击触发，满足自动播放策略）
 */

function pickZhVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "zh-CN") ||
    voices.find((v) => v.lang.startsWith("zh")) ||
    null
  );
}

/** 朗读完毕 resolve；不支持或失败时也会 resolve，避免卡住 */
export function speakIntroNarration(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    let started = false;
    const run = () => {
      if (started) return;
      started = true;

      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.92;
      const voice = pickZhVoice();
      if (voice) u.voice = voice;
      u.onend = () => finish();
      u.onerror = () => finish();
      window.speechSynthesis.speak(u);
    };

    let fallbackTimer: number | undefined;
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      if (fallbackTimer !== undefined) {
        clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
      run();
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      run();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
      fallbackTimer = window.setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        run();
      }, 600);
    }
  });
}

export function cancelIntroSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** 轻量短句播报：用于提交中与结果反馈，不阻塞业务流程。 */
export function speakDrivingGuideLine(text: string): void {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 1;
  const voice = pickZhVoice();
  if (voice) u.voice = voice;
  // 短提示与其他语音不叠加，先取消旧播报。
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
