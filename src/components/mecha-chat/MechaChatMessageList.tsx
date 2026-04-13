"use client";

import { Volume2 } from "lucide-react";

export type ChatBubble = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt?: string;
};

type Props = {
  messages: ChatBubble[];
  mechaImageUrl?: string | null;
  onSpeak: (id: string, text: string) => void;
  speakingId: string | null;
};

export function MechaChatMessageList({
  messages,
  mechaImageUrl,
  onSpeak,
  speakingId,
}: Props) {
  return (
    <div className="flex flex-col gap-3 px-1">
      {messages.map((m) => {
        const isUser = m.role === "USER";
        return (
          <div
            key={m.id}
            className={`flex w-full gap-2 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {!isUser && mechaImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mechaImageUrl}
                alt=""
                className="mt-0.5 h-9 w-9 shrink-0 rounded-lg border border-cyan-500/30 bg-black/20 object-contain"
              />
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                isUser
                  ? "bg-cyan-500/25 text-cyan-50"
                  : "border border-cyan-500/25 bg-[#0a1628]/90 text-cyan-50/95"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
              {!isUser && (
                <button
                  type="button"
                  onClick={() => onSpeak(m.id, m.content)}
                  className="mt-2 flex items-center gap-1 text-xs text-cyan-300/90 hover:text-cyan-200"
                  aria-label="朗读"
                >
                  <Volume2 size={14} />
                  {speakingId === m.id ? "播放中…" : "朗读"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
