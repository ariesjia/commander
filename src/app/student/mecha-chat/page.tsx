"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Plus } from "lucide-react";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import {
  MechaChatMessageList,
  type ChatBubble,
} from "@/components/mecha-chat/MechaChatMessageList";
import { MechaChatComposer } from "@/components/mecha-chat/MechaChatComposer";
import { api } from "@/lib/api";
import { useData } from "@/contexts/DataContext";
import { useReadAloud } from "@/hooks/useReadAloud";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";
import Link from "next/link";

type SessionRow = {
  id: string;
  mechaSlug: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function MechaChatPage() {
  const router = useRouter();
  const { mechaChat, adoptedMechaIds, adoptedMechas, mechaPointsBySlug } = useData();
  const { speakNow, cancel, isSpeaking } = useReadAloud();
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const primarySlug = adoptedMechaIds[0] ?? null;
  const primaryPoints = primarySlug ? (mechaPointsBySlug[primarySlug] ?? 0) : 0;
  const { data: primaryMecha } = useMecha(primarySlug);
  const levelInfo = getLevelFromMecha(primaryMecha, primaryPoints);
  const mechaImageUrl = levelInfo?.imageUrl ?? primaryMecha?.levels?.[0]?.imageUrl;

  const [loading, setLoading] = useState(true);
  const [editableSessionId, setEditableSessionId] = useState<string | null>(null);
  const [viewSessionId, setViewSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canSend =
    !!editableSessionId &&
    viewSessionId === editableSessionId &&
    mechaChat.enabled;

  const editableMechaSlug = sessions.find((s) => s.id === editableSessionId)?.mechaSlug;
  const primaryMismatch =
    !!editableSessionId &&
    !!primarySlug &&
    !!editableMechaSlug &&
    editableMechaSlug !== primarySlug;

  const loadMessages = useCallback(async (sessionId: string) => {
    const res = await api.get<{
      messages: Array<{
        id: string;
        role: "USER" | "ASSISTANT";
        content: string;
        createdAt: string;
      }>;
    }>(`/api/student/mecha-chat/sessions/${sessionId}/messages`);
    setMessages(
      res.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    );
  }, []);

  const refreshSessionList = useCallback(async () => {
    const res = await api.get<{ sessions: SessionRow[] }>(
      "/api/student/mecha-chat/sessions",
    );
    setSessions(res.sessions);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await api.post<SessionRow>("/api/student/mecha-chat/sessions");
      setEditableSessionId(created.id);
      setViewSessionId(created.id);
      setMessages([]);
      await refreshSessionList();
    } catch (e: unknown) {
      const err = e as { status?: number; body?: { code?: string } };
      if (err?.status === 403) {
        router.replace("/student");
        return;
      }
      if (err?.body && typeof err.body === "object" && (err.body as { code?: string }).code === "NEED_PRIMARY_MECHA") {
        setError("need_mecha");
        return;
      }
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, [refreshSessionList, router]);

  const bootOnce = useRef(false);
  useEffect(() => {
    if (!mechaChat.enabled) {
      router.replace("/student");
      return;
    }
    if (adoptedMechas.length === 0) {
      setLoading(false);
      return;
    }
    if (bootOnce.current) return;
    bootOnce.current = true;
    void bootstrap();
  }, [mechaChat.enabled, adoptedMechas.length, bootstrap, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSpeak = useCallback(
    (id: string, text: string) => {
      cancel();
      setSpeakingId(id);
      speakNow(text, {
        onEnd: () => setSpeakingId(null),
      });
    },
    [cancel, speakNow],
  );

  useEffect(
    () => () => {
      cancel();
    },
    [cancel],
  );

  const sendPayload = useCallback(
    async (body: { text?: string; audioBase64?: string; audioMimeType?: string }) => {
      if (!editableSessionId) return;
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const localAssistantId = `${localId}-assistant`;
      const isVoice = !body.text && !!body.audioBase64;
      const optimisticUserText = body.text?.trim() || "语音识别中…";
      setSending(true);
      setError(null);
      setMessages((prev) => [
        ...prev,
        {
          id: localId,
          role: "USER" as const,
          content: optimisticUserText,
          pending: isVoice,
        },
        {
          id: localAssistantId,
          role: "ASSISTANT" as const,
          content: "识别与思考中…",
          pending: true,
        },
      ]);
      try {
        const res = await api.post<{
          userMessage: { id: string; content: string };
          assistantMessage: { id: string; content: string; createdAt: string };
        }>(`/api/student/mecha-chat/sessions/${editableSessionId}/messages`, body);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === localId) {
              return {
                id: res.userMessage.id,
                role: "USER" as const,
                content: res.userMessage.content,
              };
            }
            if (m.id === localAssistantId) {
              return {
                id: res.assistantMessage.id,
                role: "ASSISTANT" as const,
                content: res.assistantMessage.content,
                createdAt: res.assistantMessage.createdAt,
              };
            }
            return m;
          }),
        );
        await refreshSessionList();
      } catch (e: unknown) {
        setMessages((prev) => prev.filter((m) => m.id !== localId && m.id !== localAssistantId));
        const err = e as Error & { message?: string };
        setError(err.message ?? "发送失败");
      } finally {
        setSending(false);
      }
    },
    [editableSessionId, refreshSessionList],
  );

  const onSendText = (text: string) => void sendPayload({ text });

  const onSendAudio = (dataUrl: string, mimeType: string) =>
    void sendPayload({ audioBase64: dataUrl, audioMimeType: mimeType });

  const newSession = async () => {
    setSending(true);
    try {
      const created = await api.post<SessionRow>("/api/student/mecha-chat/sessions");
      setEditableSessionId(created.id);
      setViewSessionId(created.id);
      setMessages([]);
      await refreshSessionList();
      setHistoryOpen(false);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    try {
      await refreshSessionList();
    } catch {
      // ignore
    }
  };

  const selectSession = async (id: string) => {
    setViewSessionId(id);
    setLoading(true);
    try {
      await loadMessages(id);
    } finally {
      setLoading(false);
    }
    setHistoryOpen(false);
  };

  if (!mechaChat.enabled) {
    return null;
  }

  if (!loading && adoptedMechas.length === 0) {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <StudentPageHeader title="机甲对话" backHref="/student" />
        <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/10 to-transparent px-6 py-10 text-center">
          <p className="text-sm text-s-text-secondary">
            请先领养机甲，再来和伙伴对话。
          </p>
          <Link
            href="/student"
            className="mt-6 inline-block rounded-xl bg-s-primary/90 px-6 py-3 text-sm font-semibold text-[#0a0f18]"
          >
            返回首页领养
          </Link>
        </div>
      </div>
    );
  }

  if (error === "load_failed") {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <StudentPageHeader title="机甲对话" backHref="/student" />
        <p className="text-center text-sm text-rose-300">加载失败，请稍后再试。</p>
      </div>
    );
  }

  if (error === "need_mecha") {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <StudentPageHeader title="机甲对话" backHref="/student" />
        <p className="text-center text-sm text-amber-200">
          请先在首页设置主机甲后再来对话。
        </p>
        <Link
          href="/student"
          className="text-center text-sm text-cyan-300 underline"
        >
          返回首页
        </Link>
      </div>
    );
  }

  const title =
    primaryMecha && levelInfo
      ? `${primaryMecha.name} · 对话`
      : "机甲对话";

  return (
    <div className="flex min-h-[70vh] flex-col gap-3 pb-6">
      <StudentPageHeader title={title} backHref="/student" />

      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => void openHistory()}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-cyan-100/90"
        >
          <History size={16} />
          历史
        </button>
        <button
          type="button"
          onClick={() => void newSession()}
          disabled={sending}
          className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-100 disabled:opacity-50"
        >
          <Plus size={16} />
          新建会话
        </button>
      </div>

      {primaryMismatch && (
        <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          主机甲已在其他页面切换，请点击「新建会话」以使用当前机甲档案对话。
        </p>
      )}

      {loading && messages.length === 0 ? (
        <p className="text-center text-sm text-s-text-secondary">加载中…</p>
      ) : (
        <div className="flex min-h-[40vh] flex-1 flex-col rounded-2xl border border-cyan-500/20 bg-[#060b14]/90 p-3">
          <div className="min-h-[200px] flex-1 overflow-y-auto">
            <MechaChatMessageList
              messages={messages}
              mechaImageUrl={mechaImageUrl}
              onSpeak={(id, t) => handleSpeak(id, t)}
              speakingId={isSpeaking ? speakingId : null}
            />
            <div ref={bottomRef} />
          </div>
          {error &&
            error !== "need_mecha" &&
            error !== "load_failed" && (
            <p className="mb-2 text-center text-xs text-rose-300">{error}</p>
          )}
          <MechaChatComposer
            disabled={!canSend}
            sending={sending}
            onSendText={onSendText}
            onSendAudio={onSendAudio}
          />
        </div>
      )}

      {historyOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/50"
          role="presentation"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="h-full w-[min(100%,320px)] overflow-y-auto border-l border-cyan-500/30 bg-[#0a1628] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-sm font-medium text-cyan-100">近期会话</p>
            <ul className="flex flex-col gap-2">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => void selectSession(s.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                      viewSessionId === s.id
                        ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-50"
                        : "border-white/10 text-cyan-100/85"
                    }`}
                  >
                    <span className="line-clamp-2">
                      {s.title || "新对话"}
                    </span>
                    <span className="mt-1 block text-[10px] text-s-text-secondary">
                      {new Date(s.updatedAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
