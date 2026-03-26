import { SPEECH_SYNTHESIS_RATE } from "@/lib/speech-config";

/** iPad/iPhone / iPadOS 桌面 UA */
export function isIOSSpeechGestureSensitiveEnvironment(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * iOS WebKit：首次 speak 必须在用户手势的同步调用栈内，否则后续在 fetch/useEffect
 * 异步链里的朗读常完全无声。在发起网络请求或任何 await 之前调用。
 *
 * 使用极短文案，POST 返回后战报会 cancel 队列，不会与遇敌第一句长期叠在一起。
 */
export function warmupSpeechSynthesisFromUserGesture(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!isIOSSpeechGestureSensitiveEnvironment()) return;

  const synth = window.speechSynthesis;
  synth.cancel();
  if (synth.paused) synth.resume();

  const u = new SpeechSynthesisUtterance("战斗开始。");
  u.lang = "zh-CN";
  u.rate = SPEECH_SYNTHESIS_RATE;
  const voices = synth.getVoices();
  const zh =
    voices.find((v) => v.lang === "zh-CN") ?? voices.find((v) => v.lang.startsWith("zh"));
  if (zh) u.voice = zh;
  synth.speak(u);
}
