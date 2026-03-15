"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, X, Volume2, Square, Lock } from "lucide-react";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { api } from "@/lib/api";
import { formatDateFriendly } from "@/lib/utils";
import type { MechaEvolutionDto } from "@/app/api/student/mecha-evolution/[id]/route";

interface AdoptedMecha {
  id: string;
  slug: string;
  points: number;
}

interface MechaLibraryProps {
  adoptedMechas: AdoptedMecha[];
  mechaPointsBySlug: Record<string, number>;
  showPinyin?: boolean;
}

function MechaCard({
  slug,
  mechaPoints,
  onSelect,
}: {
  slug: string;
  mechaPoints: number;
  onSelect: () => void;
}) {
  const { data: mecha } = useMecha(slug);
  const levelInfo = getLevelFromMecha(mecha, mechaPoints);

  if (!mecha || !levelInfo) return null;

  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-s-primary/20 bg-s-card/30 p-3 transition-all hover:border-s-primary/50 hover:bg-s-primary/10"
    >
      <img
        src={levelInfo.imageUrl}
        alt={mecha.name}
        className="w-16 h-20 object-contain rounded-lg shrink-0"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <span className="text-xs font-medium text-s-text truncate w-full text-center">{mecha.name}</span>
      <span className="text-[10px] text-s-text-secondary truncate w-full text-center">{levelInfo.name}</span>
    </button>
  );
}

function MechaDetailModal({
  studentMechaId,
  slug,
  mechaPoints,
  showPinyin,
  onClose,
}: {
  studentMechaId: string;
  slug: string;
  mechaPoints: number;
  showPinyin?: boolean;
  onClose: () => void;
}) {
  const { data: mecha } = useMecha(slug);
  const levelInfo = getLevelFromMecha(mecha, mechaPoints);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [evolution, setEvolution] = useState<MechaEvolutionDto | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(true);
  const [evolutionError, setEvolutionError] = useState(false);

  useEffect(() => {
    setEvolutionLoading(true);
    setEvolutionError(false);
    api
      .get<MechaEvolutionDto>(`/api/student/mecha-evolution/${studentMechaId}`)
      .then((data) => {
        setEvolution(data);
        setEvolutionError(false);
      })
      .catch(() => {
        setEvolution(null);
        setEvolutionError(true);
      })
      .finally(() => setEvolutionLoading(false));
  }, [studentMechaId]);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;
    setSpeechSupported(ok);
    if (ok && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    const text = mecha?.intro;
    if (!text || !speechSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <motion.div
        className="mecha-detail-modal relative flex flex-col rounded-2xl bg-[#0c1222] border border-s-primary/20 w-full max-w-md max-h-[80vh] md:max-h-[calc(100vh-6rem)] min-h-0 shadow-xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 固定顶部：关闭按钮 */}
        <div className="absolute right-3 top-3 z-20 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10 transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mecha-detail-content flex flex-col overflow-y-auto overflow-x-hidden flex-1 min-h-0 p-6 pt-12 min-w-0">
          {/* 图片区域 */}
          <div className="mecha-detail-image flex justify-center shrink-0">
            {mecha && levelInfo ? (
              <img
                src={levelInfo.imageUrl}
                alt={mecha.name}
                className="w-56 h-72 sm:w-64 sm:h-80 object-contain rounded-xl"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="flex items-center justify-center w-56 h-72 rounded-xl bg-white/5">
                <span className="text-s-text-secondary text-sm">加载中...</span>
              </div>
            )}
          </div>

          {/* 文字区域 */}
          {mecha && levelInfo && (
            <div className="mecha-detail-text flex flex-col flex-1 min-w-0 mt-4 overflow-x-hidden">
              <h3 className="text-s-primary font-display text-xl font-bold text-center">
                <TextWithPinyin text={mecha.name} showPinyin={!!showPinyin} />
              </h3>
              <p className="text-s-text-secondary text-sm mt-0.5 text-center">
                <TextWithPinyin text={levelInfo.name} showPinyin={!!showPinyin} />
              </p>
              {levelInfo.description && (
                <p className="text-s-text-secondary text-sm mt-1.5 text-center leading-relaxed">
                  <TextWithPinyin text={levelInfo.description} showPinyin={!!showPinyin} />
                </p>
              )}
              {mecha.intro && (
                <div className="mt-3 min-w-0">
                  <p className="mecha-detail-story text-s-text text-sm md:text-base text-left break-words">
                    <TextWithPinyin
                      text={mecha.intro}
                      showPinyin={!!showPinyin}
                    />
                  </p>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={handleSpeak}
                      className={
                        "mt-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors " +
                        (isSpeaking ? "bg-s-primary/30 text-s-primary" : "bg-s-primary/10 text-s-primary hover:bg-s-primary/20")
                      }
                    >
                      {isSpeaking ? (
                        <span className="flex items-center gap-1.5">
                          <Square size={14} />
                          停止朗读
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Volume2 size={14} />
                          朗读故事
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* 进化历程：垂直时间轴 - 左侧日期、中间时间线+圆点、右侧等级图+名称 */}
              <div className="mt-6 pt-4 border-t border-s-primary/20">
                <h4 className="text-sm font-semibold text-s-primary mb-4">进化历程</h4>
                {evolutionLoading ? (
                  <div className="py-4 flex items-center justify-center">
                    <span className="text-sm text-s-text-secondary">加载中...</span>
                  </div>
                ) : evolutionError ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-s-text-secondary">加载失败，请确保已切换到学生模式</p>
                  </div>
                ) : evolution && evolution.milestones.length > 0 ? (
                  <div className="space-y-0">
                    {evolution.milestones.map((m, i) => {
                      const isReached = !!m.reachedAt;
                      const isLast = i === evolution.milestones.length - 1;
                      return (
                        <div key={m.level} className="flex items-start gap-3">
                          {/* 左侧：升级时间 */}
                          <div className="w-20 shrink-0 pt-0.5">
                            <p className="text-xs text-s-text-secondary" title={m.reachedAt ?? undefined}>
                              {m.reachedAt ? formatDateFriendly(m.reachedAt) : "未解锁"}
                            </p>
                          </div>
                          {/* 中间：时间线 + 圆点 */}
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className={`w-3 h-3 rounded-full shrink-0 ${
                                isReached ? "bg-s-primary ring-2 ring-s-primary/50" : "bg-s-text-secondary/30"
                              }`}
                            />
                            {!isLast && (
                              <div
                                className={`w-0.5 flex-1 min-h-[2.5rem] ${
                                  isReached ? "bg-s-primary/40" : "bg-s-text-secondary/20"
                                }`}
                              />
                            )}
                          </div>
                          {/* 右侧：等级图 + 等级名 */}
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex items-start gap-3">
                              <img
                                src={m.imageUrl}
                                alt={m.name}
                                className={`w-14 h-[4.5rem] object-contain rounded-lg shrink-0 ${
                                  isReached ? "opacity-100" : "opacity-40 grayscale"
                                }`}
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isReached ? "text-s-text" : "text-s-text-secondary"}`}>
                                  {m.level === 0 ? (
                                    <>
                                      <TextWithPinyin text="领养" showPinyin={!!showPinyin} />
                                      <span> · </span>
                                      <TextWithPinyin text={m.name} showPinyin={!!showPinyin} />
                                    </>
                                  ) : (
                                    <>
                                      <TextWithPinyin text="升级至" showPinyin={!!showPinyin} />
                                      <span> </span>
                                      <TextWithPinyin text={m.name} showPinyin={!!showPinyin} />
                                    </>
                                  )}
                                </p>
                                {!isReached && m.threshold > 0 && (
                                  <p className="text-xs text-s-text-secondary mt-0.5 flex items-center gap-1">
                                    <Lock size={10} />
                                    {m.threshold} 积分可解锁
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-s-text-secondary">暂无进化记录</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MechaLibrary({ adoptedMechas, mechaPointsBySlug, showPinyin = false }: MechaLibraryProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AdoptedMecha | null>(null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-s-primary/30 bg-s-primary/5 px-4 py-2.5 text-sm text-s-primary transition-colors hover:bg-s-primary/10"
      >
        <Library size={18} />
        机甲库
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-[env(safe-area-inset-top,0px)] bottom-0 z-50 flex w-full max-w-sm flex-col rounded-r-2xl bg-[#0c1222] border-r border-s-primary/20 shadow-[4px_0_24px_rgba(0,0,0,0.3)] overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-s-primary/20">
                <h2 className="text-lg font-semibold text-s-text">机甲库</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-w-0">
                <div className="grid grid-cols-3 gap-3">
                  {adoptedMechas.map((m) => (
                    <MechaCard
                      key={m.id}
                      slug={m.slug}
                      mechaPoints={m.points}
                      onSelect={() => setSelected(m)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {selected && (
                <MechaDetailModal
                  key={selected.id}
                  studentMechaId={selected.id}
                  slug={selected.slug}
                  mechaPoints={selected.points}
                  showPinyin={showPinyin}
                  onClose={() => setSelected(null)}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
