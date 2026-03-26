"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Square, History, Clapperboard } from "lucide-react";
import { useMecha, getLevelFromMecha } from "@/hooks/useMecha";
import { useReadAloud } from "@/hooks/useReadAloud";
import { StudentSideDrawer } from "@/components/student/StudentSideDrawer";
import { TextWithPinyin } from "@/components/ui/TextWithPinyin";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { api } from "@/lib/api";
import { formatDateFriendly } from "@/lib/utils";
import type { MechaEvolutionDto } from "@/app/api/student/mecha-evolution/[id]/route";
import { buildMechaReadAloudText } from "@/lib/mecha-speech";
import { MechaSkillList } from "@/components/mecha/MechaSkillList";
import { MechaEvolutionVideoModal } from "@/components/mecha/MechaEvolutionVideoModal";

interface AdoptedMecha {
  id: string;
  slug: string;
  points: number;
}

interface MechaLibraryPageProps {
  adoptedMechas: AdoptedMecha[];
  mechaPointsBySlug: Record<string, number>;
  showPinyin?: boolean;
  baseScore?: import("@/lib/score-display").BaseScore;
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

/** 进化历程 Modal：仅展示已解锁级别，点击图可看大图，默认大图为最高级别 */
function EvolutionModal({
  evolution,
  showPinyin,
  onClose,
}: {
  evolution: MechaEvolutionDto;
  showPinyin?: boolean;
  onClose: () => void;
}) {
  const reached = evolution.milestones.filter((m) => !!m.reachedAt);
  const highestLevel = reached[reached.length - 1];
  const [largeImage, setLargeImage] = useState<{ url: string; name: string } | null>(
    highestLevel ? { url: highestLevel.imageUrl, name: highestLevel.name } : null
  );
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (!largeImage && highestLevel) {
      setLargeImage({ url: highestLevel.imageUrl, name: highestLevel.name });
    }
  }, [highestLevel, largeImage]);

  /** 挂到 body，z 高于 StudentSideDrawer（z-61），低于 ImagePreviewModal（z-80） */
  const evolutionLayer =
    typeof document !== "undefined"
      ? createPortal(
          <div className="theme-student">
            <motion.div
              className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            >
              <motion.div
                className="relative flex flex-col rounded-2xl bg-[#0c1222] border border-s-primary/20 w-full max-w-xl max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
          <div className="flex items-center justify-between p-4 border-b border-s-primary/20">
            <h3 className="text-lg font-semibold text-s-primary">进化历程</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-s-text-secondary hover:bg-white/10">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
            {/* 大图预览（默认最高级别，点击可全屏查看） */}
            <div className="md:w-1/2 shrink-0 p-4 flex flex-col items-center justify-center md:border-r border-s-primary/20 border-b md:border-b-0">
              {largeImage ? (
                <button
                  onClick={() => setPreviewImage(largeImage)}
                  className="w-full aspect-[3/4] max-h-64 flex items-center justify-center rounded-xl overflow-hidden bg-white/5 hover:ring-2 ring-s-primary/50 transition-all cursor-zoom-in"
                >
                  <img
                    src={largeImage.url}
                    alt={largeImage.name}
                    className="w-full h-full object-contain"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </button>
              ) : (
                <div className="w-full aspect-[3/4] max-h-64 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="text-sm text-s-text-secondary">点击下方节点查看</span>
                </div>
              )}
              {largeImage && (
                <p className="mt-2 text-sm text-s-text-secondary text-center">
                  <TextWithPinyin text={largeImage.name} showPinyin={!!showPinyin} />
                </p>
              )}
              {largeImage && (
                <p className="mt-1 text-xs text-s-text-secondary/70">点击图片查看大图</p>
              )}
            </div>

            {/* 右侧：时间轴（仅已解锁） */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-0">
                {reached.map((m, i) => {
                  const isLast = i === reached.length - 1;
                  const eventLabel = m.level === 0 ? "领养" : "升级至";
                  return (
                    <div key={m.level} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => setLargeImage({ url: m.imageUrl, name: m.name })}
                          className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-transparent hover:border-s-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-s-primary/50"
                        >
                          <img
                            src={m.imageUrl}
                            alt={m.name}
                            className="w-full h-full object-contain"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </button>
                        {!isLast && <div className="w-0.5 flex-1 min-h-[1.5rem] bg-s-primary/40" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <p className="text-sm font-medium text-s-text">
                          <TextWithPinyin text={eventLabel} showPinyin={!!showPinyin} />
                          <span> </span>
                          <TextWithPinyin text={m.name} showPinyin={!!showPinyin} />
                        </p>
                        <p className="text-xs text-s-text-secondary mt-0.5">
                          {formatDateFriendly(m.reachedAt!)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
              </motion.div>
            </motion.div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {evolutionLayer}

      {/* 全屏大图 */}
      <AnimatePresence>
        {previewImage && (
          <ImagePreviewModal
            key={previewImage.url}
            imageUrl={previewImage.url}
            caption={previewImage.name}
            showPinyin={showPinyin}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** 抽屉：机甲介绍、朗读、历程按钮 */
function MechaDrawer({
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
  const { speechSupported, isSpeaking, speak, cancel } = useReadAloud();
  const [evolution, setEvolution] = useState<MechaEvolutionDto | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [evolutionError, setEvolutionError] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const videoUrl = mecha?.evolutionVideoUrl?.trim() ?? "";

  const handleSpeak = () => {
    if (!mecha || !levelInfo || !speechSupported) return;
    const text = buildMechaReadAloudText(mecha, levelInfo);
    if (!text.trim()) return;
    if (isSpeaking) {
      cancel();
      return;
    }
    speak(text);
  };

  const handleOpenEvolution = async () => {
    setEvolutionLoading(true);
    setEvolutionError(false);
    try {
      const data = await api.get<MechaEvolutionDto>(`/api/student/mecha-evolution/${studentMechaId}`);
      setEvolution(data);
      setShowEvolutionModal(true);
    } catch {
      setEvolutionError(true);
    } finally {
      setEvolutionLoading(false);
    }
  };

  const footer = (
    <>
      {mecha && levelInfo && speechSupported && (
        <button
          type="button"
          onClick={handleSpeak}
          className={
            "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-colors " +
            (isSpeaking ? "bg-s-primary/30 text-s-primary" : "bg-s-primary/10 text-s-primary hover:bg-s-primary/20")
          }
        >
          {isSpeaking ? (
            <>
              <Square size={18} />
              停止朗读
            </>
          ) : (
            <>
              <Volume2 size={18} />
              朗读故事
            </>
          )}
        </button>
      )}
      {videoUrl ? (
        <button
          type="button"
          onClick={() => setShowVideoModal(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100/95 hover:bg-cyan-400/15 transition-colors touch-manipulation"
        >
          <Clapperboard size={18} />
          进化影像
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleOpenEvolution}
        disabled={evolutionLoading}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-s-primary/30 bg-s-primary/5 px-4 py-3 text-sm text-s-primary hover:bg-s-primary/10 transition-colors disabled:opacity-50"
      >
        <History size={18} />
        {evolutionLoading ? "加载中..." : evolutionError ? "加载失败" : "进化历程"}
      </button>
    </>
  );

  return (
    <>
      <StudentSideDrawer onClose={onClose} footer={footer}>
        {mecha && (
          <h3 className="text-lg font-semibold text-s-primary text-center mb-4">
            <TextWithPinyin text={mecha.name} showPinyin={!!showPinyin} />
          </h3>
        )}
        <div className="flex justify-center mb-4">
          {mecha && levelInfo ? (
            <img
              src={levelInfo.imageUrl}
              alt={mecha.name}
              className="w-40 h-52 object-contain rounded-xl"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="w-40 h-52 rounded-xl bg-white/5 flex items-center justify-center">
              <span className="text-sm text-s-text-secondary">加载中...</span>
            </div>
          )}
        </div>

        {levelInfo && (
          <div className="mb-4">
            <p className="text-s-text-secondary text-sm text-center">
              <TextWithPinyin text={levelInfo.name} showPinyin={!!showPinyin} />
            </p>
            {levelInfo.description && (
              <p className="text-s-text-secondary text-sm text-center mt-1.5 leading-relaxed">
                <TextWithPinyin text={levelInfo.description} showPinyin={!!showPinyin} />
              </p>
            )}
          </div>
        )}

        {mecha?.intro && (
          <div className="mb-4 min-w-0">
            <p className="text-s-text text-sm leading-relaxed break-words">
              <TextWithPinyin text={mecha.intro} showPinyin={!!showPinyin} />
            </p>
          </div>
        )}

        {mecha && levelInfo && (
          <MechaSkillList
            skills={mecha.skills}
            currentLevelNum={levelInfo.level}
            tone="student"
            showPinyin={!!showPinyin}
          />
        )}
      </StudentSideDrawer>

      <AnimatePresence>
        {showEvolutionModal && evolution && (
          <EvolutionModal
            evolution={evolution}
            showPinyin={showPinyin}
            onClose={() => setShowEvolutionModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVideoModal && videoUrl && mecha ? (
          <MechaEvolutionVideoModal
            key="mecha-evolution-video"
            videoUrl={videoUrl}
            title={mecha.name}
            onClose={() => setShowVideoModal(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function MechaLibraryPage({
  adoptedMechas,
  mechaPointsBySlug,
  showPinyin = false,
  baseScore = 1,
}: MechaLibraryPageProps) {
  const [selected, setSelected] = useState<AdoptedMecha | null>(null);

  return (
    <>
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

      <AnimatePresence>
        {selected && (
          <MechaDrawer
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
  );
}
