"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import {
  HandwritingCanvas,
  type HandwritingCanvasHandle,
} from "@/components/driving-guide/HandwritingCanvas";
import { api } from "@/lib/api";
import { useData } from "@/contexts/DataContext";
import { DRIVING_GUIDE_COPY } from "@/lib/driving-guide/copy";
import { DRIVING_GUIDE_STEPS_PER_SESSION } from "@/lib/driving-guide/constants";
import {
  speakIntroNarration,
  cancelIntroSpeech,
} from "@/lib/driving-guide/speech";

type StepChar = { char: string; pinyin: string };
type Step = { stepIndex: number; word: string; chars: StepChar[] };

type SessionActive = {
  status: "active";
  dateKey: string;
  sessionHash: string;
  steps: Step[];
};

export default function DrivingGuidePage() {
  const router = useRouter();
  const { drivingGuide, refetch } = useData();
  const canvasRef = useRef<HandwritingCanvasHandle>(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionActive | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<
        | SessionActive
        | { status: "completed"; dateKey: string; completedAt: string }
      >("/api/student/driving-guide/session");
      if (res.status === "completed") {
        setSession(null);
        setCompletedAt(res.completedAt);
        setFinished(true);
      } else {
        setSession(res);
        setCompletedAt(null);
        setFinished(false);
      }
    } catch (e: unknown) {
      const err = e as { status?: number };
      if (err?.status === 403) {
        router.replace("/student");
        return;
      }
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!drivingGuide.enabled) {
      router.replace("/student");
      return;
    }
    void load();
  }, [drivingGuide.enabled, load, router]);

  useEffect(() => () => cancelIntroSpeech(), []);

  const current = session?.steps[stepIdx];

  const handleStart = async () => {
    if (introPlaying) return;
    setIntroPlaying(true);
    setFeedback(null);
    try {
      await speakIntroNarration(DRIVING_GUIDE_COPY.readyIntroNarration);
    } finally {
      setIntroPlaying(false);
    }
    setSessionStarted(true);
    setStepIdx(0);
    setFeedback(null);
    canvasRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (!session || !current) return;
    const dataUrl = canvasRef.current?.toDataURL() ?? "";
    if (!dataUrl || dataUrl.length < 100) {
      setFeedback({ kind: "bad", text: "请先在手写区按拼音书写。" });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.post<{
        ok: boolean;
        hint?: string;
        encouragement?: string;
        finishedSession?: boolean;
      }>("/api/student/driving-guide/step", {
        sessionHash: session.sessionHash,
        stepIndex: stepIdx,
        imageBase64: dataUrl,
      });
      if (res.ok) {
        setFeedback({ kind: "ok", text: res.encouragement ?? "好！" });
        canvasRef.current?.clear();
        if (res.finishedSession) {
          setFinished(true);
          setCompletedAt(new Date().toISOString());
          await refetch();
        } else {
          setStepIdx((i) => i + 1);
        }
      } else {
        setFeedback({ kind: "bad", text: res.hint ?? "再试一次" });
      }
    } catch {
      setFeedback({ kind: "bad", text: "提交失败，请重试。" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!drivingGuide.enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <StudentPageHeader title={DRIVING_GUIDE_COPY.pageTitle} backHref="/student" />
        <p className="text-center text-sm text-s-text-secondary">加载中…</p>
      </div>
    );
  }

  if (finished && completedAt) {
    return (
      <div className="flex flex-col gap-5 pb-6">
        <StudentPageHeader title={DRIVING_GUIDE_COPY.pageTitle} backHref="/student" />
        <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-500/10 to-transparent px-6 py-10 text-center">
          <BookOpen className="mx-auto mb-3 text-indigo-300" size={40} />
          <h2 className="font-display text-lg font-semibold text-indigo-100">
            {DRIVING_GUIDE_COPY.doneTitle}
          </h2>
          <p className="mt-3 text-sm text-s-text-secondary leading-relaxed">
            {DRIVING_GUIDE_COPY.doneBody}
          </p>
          <button
            type="button"
            onClick={() => router.push("/student")}
            className="mt-8 w-full max-w-sm rounded-xl bg-s-primary/90 py-3.5 text-sm font-semibold text-[#0a0f18]"
          >
            {DRIVING_GUIDE_COPY.backHome}
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <StudentPageHeader title={DRIVING_GUIDE_COPY.pageTitle} backHref="/student" />
        <p className="text-center text-sm text-s-text-secondary">暂时无法加载练习，请稍后再试。</p>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="flex flex-col gap-5 pb-6">
        <StudentPageHeader title={DRIVING_GUIDE_COPY.pageTitle} backHref="/student" />
        <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-500/10 to-transparent px-6 py-10 text-center">
          <h2 className="font-display text-lg font-semibold text-indigo-100">
            {DRIVING_GUIDE_COPY.readyTitle}
          </h2>
          <p className="mt-3 text-sm text-s-text-secondary leading-relaxed">
            {DRIVING_GUIDE_COPY.readyBody}
          </p>
          <button
            type="button"
            disabled={introPlaying}
            onClick={() => void handleStart()}
            className="mt-8 w-full max-w-sm rounded-xl bg-s-primary/90 py-3.5 text-sm font-semibold text-[#0a0f18] shadow-[0_0_24px_rgba(99,102,241,0.2)] disabled:opacity-70"
          >
            {introPlaying ? DRIVING_GUIDE_COPY.readyListening : DRIVING_GUIDE_COPY.readyButton}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <StudentPageHeader title={DRIVING_GUIDE_COPY.pageTitle} backHref="/student" />

      <p className="text-center text-xs text-indigo-200/70">
        {DRIVING_GUIDE_COPY.progressLabel(stepIdx + 1, DRIVING_GUIDE_STEPS_PER_SESSION)}
      </p>

      {current && (
        <div className="rounded-2xl border border-indigo-500/20 bg-[#0c1222]/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {current.chars.map((c, i) => (
              <span
                key={`${current.word}-${i}`}
                className="text-2xl font-semibold tracking-wide text-indigo-50"
              >
                {c.pinyin}
              </span>
            ))}
          </div>

          <HandwritingCanvas ref={canvasRef} />

          <AnimatePresence>
            {feedback && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-3 text-center text-sm ${
                  feedback.kind === "ok" ? "text-emerald-300" : "text-amber-200"
                }`}
              >
                {feedback.text}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => canvasRef.current?.clear()}
              className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-s-text-secondary"
            >
              {DRIVING_GUIDE_COPY.clear}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="flex-1 rounded-xl bg-indigo-500/90 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? DRIVING_GUIDE_COPY.loading : DRIVING_GUIDE_COPY.submit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
