"use client";

import { useCallback, useRef, useState } from "react";
import { Mic, Send, Square } from "lucide-react";

type Props = {
  disabled: boolean;
  sending: boolean;
  onSendText: (text: string) => void;
  onSendAudio: (dataUrl: string, mimeType: string) => void;
};

export function MechaChatComposer({
  disabled,
  sending,
  onSendText,
  onSendAudio,
}: Props) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeRef = useRef("audio/webm");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(async () => {
    const rec = recRef.current;
    if (!rec || rec.state === "inactive") {
      setRecording(false);
      return;
    }
    await new Promise<void>((resolve) => {
      rec.addEventListener("stop", () => resolve(), { once: true });
      rec.stop();
    });
    recRef.current = null;
    setRecording(false);
    stopStream();

    const blob = new Blob(chunksRef.current, { type: mimeRef.current });
    chunksRef.current = [];
    if (blob.size < 16) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (dataUrl) onSendAudio(dataUrl, blob.type || "audio/webm");
    };
    reader.readAsDataURL(blob);
  }, [onSendAudio, stopStream]);

  const startRecording = useCallback(async () => {
    if (disabled || sending || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mimeRef.current = rec.mimeType || "audio/webm";
      chunksRef.current = [];
      rec.addEventListener("dataavailable", (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      });
      rec.start(200);
      recRef.current = rec;
      setRecording(true);
    } catch {
      // mic denied — user can type
    }
  }, [disabled, sending, recording]);

  const toggleRecord = useCallback(async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  const submitText = () => {
    const t = text.trim();
    if (!t || disabled || sending) return;
    setText("");
    onSendText(t);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-cyan-500/20 bg-[#070d18]/95 pt-3 pb-1">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? "当前为历史记录，请新建会话后再说" : "打字或按住录音…"}
          disabled={disabled || sending}
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-cyan-50 placeholder:text-s-text-secondary/60 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitText();
            }
          }}
        />
        <button
          type="button"
          disabled={disabled || sending}
          onClick={submitText}
          className="shrink-0 self-end rounded-xl bg-cyan-500/85 px-3 py-2 text-white disabled:opacity-50"
          aria-label="发送"
        >
          <Send size={18} />
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={disabled || sending}
          onClick={() => void toggleRecord()}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
            recording
              ? "bg-rose-500/80 text-white"
              : "bg-cyan-600/70 text-white hover:bg-cyan-500/80"
          } disabled:opacity-50`}
        >
          {recording ? (
            <>
              <Square size={18} fill="currentColor" />
              结束录音并发送
            </>
          ) : (
            <>
              <Mic size={18} />
              点击录音
            </>
          )}
        </button>
      </div>
    </div>
  );
}
