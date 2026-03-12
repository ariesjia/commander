"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, X, Volume2, Square } from "lucide-react";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";

interface MechaLibraryProps {
  adoptedMechaIds: string[];
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
  slug,
  mechaPoints,
  showPinyin,
  onClose,
}: {
  slug: string;
  mechaPoints: number;
  showPinyin?: boolean;
  onClose: () => void;
}) {
  const { data: mecha } = useMecha(slug);
  const levelInfo = getLevelFromMecha(mecha, mechaPoints);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    const text = mecha?.intro ?? mecha?.description;
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
        className="mecha-detail-modal relative flex flex-col rounded-2xl bg-[#0c1222] border border-s-primary/20 w-full max-w-md max-h-[80vh] md:max-h-[calc(100vh-6rem)] shadow-xl overflow-hidden"
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

        <div className="mecha-detail-content flex flex-col overflow-y-auto overflow-x-hidden flex-1 min-h-0 p-6 pt-12">
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
            <div className="mecha-detail-text flex flex-col flex-1 min-w-0 mt-4">
              <h3 className="text-s-primary font-display text-xl font-bold text-center">
                <TextWithPinyin text={mecha.name} showPinyin={!!showPinyin} />
              </h3>
              <p className="text-s-text-secondary text-sm mt-0.5 text-center">
                <TextWithPinyin text={levelInfo.name} showPinyin={!!showPinyin} />
              </p>
              {(mecha.intro ?? mecha.description) && (
                <div className="mt-3 min-w-0">
                  <p className="mecha-detail-story text-s-text text-sm md:text-base text-left break-words">
                    <TextWithPinyin
                      text={mecha.intro ?? mecha.description ?? ""}
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
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MechaLibrary({ adoptedMechaIds, mechaPointsBySlug, showPinyin = false }: MechaLibraryProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
              className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col rounded-r-2xl bg-[#0c1222] border-r border-s-primary/20 shadow-[4px_0_24px_rgba(0,0,0,0.3)]"
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

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-3">
                  {adoptedMechaIds.map((slug) => (
                    <MechaCard
                      key={slug}
                      slug={slug}
                      mechaPoints={mechaPointsBySlug[slug] ?? 0}
                      onSelect={() => setSelectedId(slug)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {selectedId && (
                <MechaDetailModal
                  key={selectedId}
                  slug={selectedId}
                  mechaPoints={mechaPointsBySlug[selectedId] ?? 0}
                  showPinyin={showPinyin}
                  onClose={() => setSelectedId(null)}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
