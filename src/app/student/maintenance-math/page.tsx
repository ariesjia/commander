"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Wrench } from "lucide-react";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { api } from "@/lib/api";
import { useData } from "@/contexts/DataContext";
import { MAINTENANCE_COPY } from "@/lib/maintenance-math/copy";
import { expectedAnswer } from "@/lib/maintenance-math/answers";
import { buildArithmeticSpeech } from "@/lib/maintenance-math/chinese-speech";
import { useReadAloud } from "@/hooks/useReadAloud";
import type { MaintenanceQuestion } from "@/lib/maintenance-math/types";

type SessionActive = {
  status: "active";
  dateKey: string;
  questions: MaintenanceQuestion[];
  meta: { generatorId: string; version: string };
  sessionHash: string;
};

type SessionCompleted = {
  status: "completed";
  dateKey: string;
  completedAt: string;
};

export default function MaintenanceMathPage() {
  const router = useRouter();
  const { refetch, maintenanceMath } = useData();
  const { speakNow, cancel: cancelSpeech } = useReadAloud();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionActive | SessionCompleted | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  /** 连续答对步数（本题组内） */
  const [combo, setCombo] = useState(0);
  /** 用于连击动画每次重新挂载 */
  const [comboBurstKey, setComboBurstKey] = useState(0);
  /** 连击条仅短时显示，避免 combo≥2 后一直占位 */
  const [comboBurstVisible, setComboBurstVisible] = useState(false);
  const comboHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 用户点击「开始」后再朗读与答题（避免手机无点击导致无法 TTS） */
  const [sessionStarted, setSessionStarted] = useState(false);
  /** 开始检修时刻（performance.now 不可用跨刷新，用 Date.now） */
  const repairStartedAtMsRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await api.get<SessionActive | SessionCompleted>("/api/student/maintenance-math/session");
      setSession(data);
      if (data.status === "active") {
        setAnswers([]);
        setStep(0);
        setInput("");
        setCombo(0);
        setComboBurstVisible(false);
        setSessionStarted(false);
        repairStartedAtMsRef.current = null;
      }
    } catch (e: unknown) {
      const err = e as Error & { status?: number; body?: { code?: string; error?: string } };
      if (err.status === 403 && err.body?.code === "MAINTENANCE_DISABLED") {
        setLoadError("disabled");
        return;
      }
      const msg = typeof err.body === "object" && err.body && "error" in err.body ? String((err.body as { error?: string }).error) : null;
      setLoadError(msg ?? err.message ?? "加载失败");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      cancelSpeech();
      if (comboHideTimerRef.current) clearTimeout(comboHideTimerRef.current);
    };
  }, [cancelSpeech]);

  const active = session?.status === "active" ? session : null;
  const total = active?.questions.length ?? 0;
  const current = active?.questions[step];

  const speakStepPrompt = useCallback(
    (stepIndex: number, q: MaintenanceQuestion) => {
      const prefix = stepIndex === 0 ? MAINTENANCE_COPY.ttsSessionStart : "";
      const text =
        prefix +
        MAINTENANCE_COPY.ttsStepPrompt(stepIndex + 1) +
        buildArithmeticSpeech(q);
      speakNow(text);
    },
    [speakNow],
  );

  /** 第 2 题起：换步后朗读（第 1 题在用户点击「开始」时同步朗读，保证移动端手势解锁 TTS） */
  useEffect(() => {
    if (!sessionStarted || !current) return;
    if (step === 0) return;
    speakStepPrompt(step, current);
  }, [sessionStarted, current, step, speakStepPrompt]);

  const handleStartSession = useCallback(() => {
    const first = active?.questions[0];
    if (!first) return;
    repairStartedAtMsRef.current = Date.now();
    setSessionStarted(true);
    speakStepPrompt(0, first);
  }, [active, speakStepPrompt]);

  /** 维修完成页：朗读收尾叙事 */
  useEffect(() => {
    if (session?.status !== "completed" && !done) return;
    speakNow(MAINTENANCE_COPY.ttsDone);
  }, [session?.status, done, speakNow]);

  const appendDigit = (d: string) => {
    if (input.length >= 3) return;
    if (input === "0" && d !== "") return setInput(d);
    setInput((prev) => prev + d);
    setLocalErr(null);
  };

  const backspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const submitAll = async (finalAnswers: number[]) => {
    if (!active) return;
    setSubmitting(true);
    setLocalErr(null);
    const started = repairStartedAtMsRef.current;
    const durationMs =
      started != null ? Math.max(0, Math.round(Date.now() - started)) : 0;
    try {
      await api.post("/api/student/maintenance-math/complete", {
        answers: finalAnswers,
        durationMs,
      });
      setDone(true);
      await refetch();
    } catch (e: unknown) {
      const err = e as Error & { status?: number; body?: { code?: string; error?: string } };
      if (err.status === 400 && err.body?.code === "WRONG_ANSWERS") {
        setLocalErr(MAINTENANCE_COPY.submitAllWrong);
        setStep(0);
        setAnswers([]);
        setInput("");
        setCombo(0);
        setComboBurstVisible(false);
        const first = active.questions[0];
        if (first) speakStepPrompt(0, first);
      } else {
        setLocalErr(err.body?.error ?? err.message ?? "提交失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmStep = () => {
    if (!active || !current) return;
    const n = parseInt(input, 10);
    if (input === "" || Number.isNaN(n)) {
      setLocalErr("请输入读数");
      return;
    }
    const exp = expectedAnswer(current);
    if (n !== exp) {
      setLocalErr("再算一算哦");
      setCombo(0);
      setComboBurstVisible(false);
      if (comboHideTimerRef.current) {
        clearTimeout(comboHideTimerRef.current);
        comboHideTimerRef.current = null;
      }
      speakNow(MAINTENANCE_COPY.wrongTryAgain);
      return;
    }
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo >= 2) {
      setComboBurstKey((k) => k + 1);
      setComboBurstVisible(true);
      if (comboHideTimerRef.current) clearTimeout(comboHideTimerRef.current);
      comboHideTimerRef.current = setTimeout(() => {
        setComboBurstVisible(false);
        comboHideTimerRef.current = null;
      }, 1400);
    }
    const next = [...answers];
    next[step] = n;
    setAnswers(next);
    setInput("");
    if (step + 1 >= total) {
      speakNow(MAINTENANCE_COPY.ttsStepReadDone(step + 1), {
        onEnd: () => {
          void submitAll(next);
        },
      });
      return;
    }
    speakNow(MAINTENANCE_COPY.ttsStepReadDone(step + 1), {
      onEnd: () => setStep((s) => s + 1),
    });
  };

  if (loadError === "disabled") {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-s-text-secondary hover:text-s-text"
        >
          <ArrowLeft size={18} />
          返回
        </button>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-s-text-secondary">
          {MAINTENANCE_COPY.disabled}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-s-text-secondary hover:text-s-text"
        >
          <ArrowLeft size={18} />
          返回
        </button>
        <p className="text-center text-red-400/90">{loadError}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-5 pb-6">
        <StudentPageHeader title={MAINTENANCE_COPY.pageTitle} backHref="/student" />
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-s-text-secondary">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-s-primary border-t-transparent" />
          <p className="text-sm">{MAINTENANCE_COPY.loading}</p>
        </div>
      </div>
    );
  }

  if (session.status === "completed" || done) {
    return (
      <div className="flex flex-col gap-5 pb-6">
        <StudentPageHeader title={MAINTENANCE_COPY.doneTitle} backHref="/student" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-10 text-center">
          <Wrench className="text-emerald-300" size={40} strokeWidth={1.5} />
          <p className="text-sm text-emerald-200/80">{MAINTENANCE_COPY.doneBody}</p>
        </div>
      </div>
    );
  }

  if (active && !sessionStarted) {
    return (
      <div className="flex flex-col gap-5 pb-6">
        <StudentPageHeader title={MAINTENANCE_COPY.pageTitle} backHref="/student" />

        <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/10 to-transparent px-6 py-10 text-center">
          <h2 className="font-display text-lg font-semibold text-cyan-100">{MAINTENANCE_COPY.readyTitle}</h2>
          <p className="mt-3 text-sm text-s-text-secondary leading-relaxed">{MAINTENANCE_COPY.readyBody}</p>
          <button
            type="button"
            onClick={handleStartSession}
            className="mt-8 w-full max-w-sm rounded-xl bg-s-primary/90 py-3.5 text-sm font-semibold text-[#0a0f18] shadow-[0_0_24px_rgba(0,212,255,0.25)] hover:bg-s-primary active:scale-[0.99] touch-manipulation"
          >
            {MAINTENANCE_COPY.readyButton}
          </button>
        </div>
      </div>
    );
  }

  const q = current;
  if (!active || !q) return null;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <StudentPageHeader title={MAINTENANCE_COPY.pageTitle} backHref="/student" />

      <div className="relative rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/10 to-transparent px-4 py-6">
        <AnimatePresence mode="wait">
          {comboBurstVisible && combo >= 2 && comboBurstKey > 0 && (
            <motion.div
              key={comboBurstKey}
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -6 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/25 to-orange-500/20 px-4 py-1.5 font-display text-sm font-bold tracking-wide text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
            >
              连击 ×{combo}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-center text-xs text-cyan-200/70">{MAINTENANCE_COPY.stepLabel(step + 1, total)}</p>
        <p className="mt-4 text-center text-sm text-s-text-secondary">{MAINTENANCE_COPY.instruction}</p>
        <div
          className={
            q.kind === "binary"
              ? "mt-6 flex items-center justify-center gap-3 font-display text-4xl font-bold tabular-nums text-s-text"
              : "mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-1 font-display text-2xl font-bold tabular-nums text-s-text sm:text-3xl"
          }
        >
          {q.kind === "binary" ? (
            <>
              <span>{q.a}</span>
              <span className="text-cyan-300/90">{q.op}</span>
              <span>{q.b}</span>
              <span className="text-s-text-secondary">=</span>
              <span className="min-w-[3ch] text-right text-s-primary">{input || "·"}</span>
            </>
          ) : (
            <>
              {q.nums.map((num, i) => (
                <Fragment key={`expr-${q.id}-${i}`}>
                  <span>{num}</span>
                  {i < q.ops.length && <span className="text-cyan-300/90">{q.ops[i]}</span>}
                </Fragment>
              ))}
              <span className="text-s-text-secondary">=</span>
              <span className="min-w-[3ch] text-right text-s-primary">{input || "·"}</span>
            </>
          )}
        </div>
        {localErr && <p className="mt-3 text-center text-sm text-amber-300/90">{localErr}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto w-full">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, i) => (
          <button
            key={`k-${i}`}
            type="button"
            disabled={submitting}
            onClick={() => {
              if (key === "⌫") backspace();
              else if (key) appendDigit(key);
            }}
            className="min-h-[52px] rounded-xl border border-white/10 bg-black/25 text-lg font-semibold text-s-text hover:bg-white/5 active:scale-[0.98] touch-manipulation disabled:opacity-50"
          >
            {key === "" ? <span className="text-transparent">.</span> : key}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={confirmStep}
        className="mx-auto w-full max-w-sm rounded-xl bg-s-primary/90 py-3.5 text-sm font-semibold text-[#0a0f18] shadow-[0_0_24px_rgba(0,212,255,0.25)] hover:bg-s-primary active:scale-[0.99] disabled:opacity-50 touch-manipulation"
      >
        {step + 1 >= total ? "完成检修" : "下一步"}
      </button>

      {!maintenanceMath.enabled && (
        <p className="text-center text-xs text-amber-400/80">维修功能已关闭，请返回首页。</p>
      )}
    </div>
  );
}
