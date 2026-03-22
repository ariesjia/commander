"use client";

import type { ReactNode } from "react";
import type { BeamVisual, StrikeAccent } from "@/components/battle/battle-fx-types";
import type { BattleArenaFxSnapshot } from "@/components/battle/useBattlePresentationFx";

type Props = {
  reduceMotionPreferred: boolean | null;
  fx: BattleArenaFxSnapshot;
};

function StrikeBeamLayer({
  beam,
  beamMiss,
  beamKey,
  beamVisual,
}: {
  beam: "player" | "enemy";
  beamMiss: boolean;
  beamKey: number;
  beamVisual: BeamVisual;
}) {
  const isPlayer = beam === "player";
  const ltr = isPlayer;
  const muzzlePos = isPlayer ? "left-[22%]" : "left-[78%]";
  const showMuzzle =
    !beamMiss && (beamVisual === "rail" || beamVisual === "slash" || beamVisual === "sweep");

  if (beamMiss) {
    return (
      <div
        key={`beam-miss-${beamKey}`}
        className={`pointer-events-none absolute top-[40%] left-[5%] z-[15] h-4 w-[90%] overflow-hidden ${
          ltr ? "animate-battle-beam-ltr-miss" : "animate-battle-beam-rtl-miss"
        }`}
        aria-hidden
      >
        <div
          className={`h-full w-full rounded-full blur-[2px] ${
            isPlayer
              ? "bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]"
              : "bg-gradient-to-r from-transparent via-orange-400/85 to-transparent shadow-[0_0_22px_rgba(251,146,60,0.75)]"
          }`}
        />
      </div>
    );
  }

  let main: ReactNode;

  switch (beamVisual) {
    case "slash":
      main = (
        <div
          key={`beam-slash-${beamKey}`}
          className={`pointer-events-none absolute top-[31%] left-[2%] z-[15] h-20 w-[96%] overflow-visible ${
            ltr ? "-rotate-[11deg]" : "rotate-[11deg]"
          }`}
          aria-hidden
        >
          <div
            className={`relative h-full w-full ${
              ltr ? "animate-battle-beam-slash-ltr" : "animate-battle-beam-slash-rtl"
            }`}
          >
            {/* 刀光外晕：宽、软，读出挥砍体积 */}
            <div
              className={`pointer-events-none absolute inset-0 rounded-[999px] blur-[10px] ${
                isPlayer
                  ? "bg-gradient-to-r from-cyan-500/25 via-fuchsia-500/55 to-cyan-400/15 opacity-95"
                  : "bg-gradient-to-r from-amber-500/30 via-rose-500/60 to-amber-400/15 opacity-95"
              }`}
            />
            {/* 刃芯：亮边 + 色芯，比单条横带更「刃」 */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 rounded-full blur-[2px] ${
                isPlayer
                  ? "bg-gradient-to-r from-transparent via-white to-cyan-300/75 shadow-[0_0_22px_rgba(255,255,255,0.75),0_0_36px_rgba(168,85,247,0.55)]"
                  : "bg-gradient-to-r from-transparent via-white to-rose-500/80 shadow-[0_0_22px_rgba(255,255,255,0.72),0_0_34px_rgba(244,63,94,0.5)]"
              }`}
            />
            {/* 刃口细线：提高锐利度 */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 ${
                isPlayer
                  ? "bg-gradient-to-r from-transparent via-white to-cyan-300/90 opacity-95"
                  : "bg-gradient-to-r from-transparent via-white to-rose-200/90 opacity-95"
              }`}
            />
          </div>
        </div>
      );
      break;
    case "bolt":
      main = (
        <div
          key={`beam-bolt-${beamKey}`}
          className="pointer-events-none absolute top-[30%] left-[4%] z-[15] h-36 w-[92%] overflow-hidden"
          aria-hidden
        >
          <div
            className={`relative h-full w-full ${
              ltr ? "animate-battle-bolt-pack-ltr" : "animate-battle-bolt-pack-rtl"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-around px-[8%]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-[78%] w-2 shrink-0 rounded-full blur-[3px] ${
                    isPlayer
                      ? "bg-gradient-to-b from-cyan-100 via-cyan-300 to-cyan-700 shadow-[0_0_18px_rgba(34,211,238,0.95)]"
                      : "bg-gradient-to-b from-amber-100 via-amber-400 to-orange-700 shadow-[0_0_18px_rgba(251,146,60,0.95)]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      );
      break;
    case "burst":
      main = (
        <div
          key={`beam-burst-${beamKey}`}
          className={`pointer-events-none absolute top-[38%] z-[15] h-36 w-36 -translate-x-1/2 -translate-y-1/2 ${muzzlePos}`}
          aria-hidden
        >
          <div
            className={`h-full w-full rounded-full border-[3px] animate-battle-beam-burst-ring ${
              isPlayer
                ? "border-cyan-300/85 bg-[radial-gradient(circle,rgba(34,211,238,0.35)_0%,transparent_65%)]"
                : "border-amber-400/90 bg-[radial-gradient(circle,rgba(251,146,60,0.4)_0%,transparent_65%)]"
            }`}
          />
        </div>
      );
      break;
    case "sweep":
      main = (
        <div
          key={`beam-sweep-${beamKey}`}
          className="pointer-events-none absolute top-[32%] left-[3%] z-[15] h-28 w-[94%] overflow-hidden"
          aria-hidden
        >
          <div
            className={`h-full w-full rounded-[999px] blur-2xl opacity-95 ${
              ltr ? "animate-battle-sweep-ltr" : "animate-battle-sweep-rtl"
            } ${
              isPlayer
                ? "bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent"
                : "bg-gradient-to-r from-transparent via-amber-400/85 to-transparent"
            }`}
          />
        </div>
      );
      break;
    case "rail":
    default:
      main = (
        <div
          key={`beam-rail-${beamKey}`}
          className={`pointer-events-none absolute top-[40%] left-[5%] z-[15] h-4 w-[90%] overflow-hidden ${
            ltr ? "animate-battle-beam-ltr" : "animate-battle-beam-rtl"
          }`}
          aria-hidden
        >
          <div
            className={`h-full w-full rounded-full blur-[2px] ${
              isPlayer
                ? "bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                : "bg-gradient-to-r from-transparent via-orange-400/85 to-transparent shadow-[0_0_22px_rgba(251,146,60,0.75)]"
            }`}
          />
        </div>
      );
  }

  return (
    <>
      {main}
      {showMuzzle ? (
        <div
          key={`muzzle-${beamKey}`}
          className={`pointer-events-none absolute top-[36%] z-[17] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full animate-battle-muzzle ${muzzlePos}`}
          style={{
            background: isPlayer
              ? "radial-gradient(circle, rgba(165,243,252,0.95) 0%, rgba(34,211,238,0.4) 45%, transparent 70%)"
              : "radial-gradient(circle, rgba(254,215,170,0.95) 0%, rgba(249,115,22,0.45) 45%, transparent 70%)",
          }}
          aria-hidden
        />
      ) : null}
    </>
  );
}

function accentClass(a: StrikeAccent | "none"): string {
  if (a === "spark") return "animate-battle-accent-spark";
  if (a === "ripple") return "animate-battle-accent-ripple";
  if (a === "ember") return "animate-battle-accent-ember";
  return "";
}

function accentVisual(a: StrikeAccent | "none"): ReactNode {
  if (a === "none") return null;
  if (a === "spark") {
    return (
      <div
        className="pointer-events-none absolute h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(250,250,255,0.95)_0%,rgba(34,211,238,0.35)_40%,transparent_68%)] shadow-[0_0_28px_rgba(34,211,238,0.65)]"
        aria-hidden
      />
    );
  }
  if (a === "ripple") {
    return (
      <div
        className="pointer-events-none absolute h-28 w-28 rounded-full border-2 border-cyan-300/55 bg-transparent"
        aria-hidden
      />
    );
  }
  return (
    <div
      className="pointer-events-none absolute h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.55)_0%,rgba(220,38,38,0.25)_50%,transparent_72%)]"
      aria-hidden
    />
  );
}

/**
 * 战斗区上半：光束、闪屏、爆炸、受击装饰、道具爆闪（不含机体立绘与地面）。
 */
export function BattleArenaFx({ reduceMotionPreferred, fx }: Props) {
  const {
    flash,
    beam,
    beamMiss,
    beamKey,
    beamVisual,
    explosionFlash,
    explosionHue,
    strikeAccentKey,
    strikeAccent,
    accentVictim,
    itemSparkKey,
    itemBurst,
  } = fx;

  const explosionClass =
    explosionHue === "plasma"
      ? "bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.38)_0%,rgba(147,51,234,0.22)_48%,transparent_72%)] animate-battle-explosion-plasma"
      : "bg-[radial-gradient(circle_at_50%_42%,rgba(251,191,36,0.42)_0%,rgba(220,38,38,0.16)_48%,transparent_72%)] animate-battle-explosion";

  const accentLeft = accentVictim === "player" ? "left-[22%]" : accentVictim === "enemy" ? "left-[78%]" : "";

  const itemRing =
    itemBurst === "magenta"
      ? "border-fuchsia-400/75 bg-fuchsia-500/12 shadow-[0_0_24px_rgba(217,70,239,0.5)]"
      : "border-cyan-300/70 bg-cyan-400/15 shadow-[0_0_24px_rgba(34,211,238,0.55)]";

  return (
    <>
      {explosionFlash && (
        <div
          className={`pointer-events-none absolute inset-0 z-[19] ${explosionClass}`}
          aria-hidden
        />
      )}
      {flash !== "none" && (
        <div
          className={`pointer-events-none absolute inset-0 z-20 ${
            flash === "crit" ? "bg-amber-400/30" : "bg-cyan-400/22"
          } animate-battle-flash`}
        />
      )}
      {!reduceMotionPreferred && beam !== "none" && (
        <StrikeBeamLayer
          beam={beam}
          beamMiss={beamMiss}
          beamKey={beamKey}
          beamVisual={beamVisual}
        />
      )}
      {strikeAccent !== "none" && accentVictim !== "none" && (
        <div
          key={`accent-${strikeAccentKey}`}
          className={`pointer-events-none absolute top-[36%] z-[16] -translate-x-1/2 -translate-y-1/2 ${accentLeft} ${accentClass(strikeAccent)}`}
          aria-hidden
        >
          {accentVisual(strikeAccent)}
        </div>
      )}
      {itemSparkKey > 0 && (
        <div
          key={`item-spark-${itemSparkKey}`}
          className={`pointer-events-none absolute left-[22%] top-[36%] z-[16] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 animate-battle-item-spark ${itemRing}`}
          aria-hidden
        />
      )}
    </>
  );
}
