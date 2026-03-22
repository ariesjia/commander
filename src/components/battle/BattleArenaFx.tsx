"use client";

import type { ReactNode } from "react";
import type { StrikeAccent } from "@/components/battle/battle-fx-types";
import type { BattleArenaFxSnapshot } from "@/components/battle/useBattlePresentationFx";

type Props = {
  reduceMotionPreferred: boolean | null;
  fx: BattleArenaFxSnapshot;
};

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
        <>
          <div
            key={`beam-${beamKey}`}
            className={`pointer-events-none absolute top-[40%] left-[5%] z-[15] h-4 w-[90%] overflow-hidden ${
              beamMiss
                ? beam === "player"
                  ? "animate-battle-beam-ltr-miss"
                  : "animate-battle-beam-rtl-miss"
                : beam === "player"
                  ? "animate-battle-beam-ltr"
                  : "animate-battle-beam-rtl"
            }`}
            aria-hidden
          >
            <div
              className={`h-full w-full rounded-full blur-[2px] ${
                beam === "player"
                  ? "bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                  : "bg-gradient-to-r from-transparent via-orange-400/85 to-transparent shadow-[0_0_22px_rgba(251,146,60,0.75)]"
              }`}
            />
          </div>
          {!beamMiss && (
            <div
              key={`muzzle-${beamKey}`}
              className={`pointer-events-none absolute top-[36%] z-[17] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full animate-battle-muzzle ${
                beam === "player" ? "left-[22%]" : "left-[78%]"
              }`}
              style={{
                background:
                  beam === "player"
                    ? "radial-gradient(circle, rgba(165,243,252,0.95) 0%, rgba(34,211,238,0.4) 45%, transparent 70%)"
                    : "radial-gradient(circle, rgba(254,215,170,0.95) 0%, rgba(249,115,22,0.45) 45%, transparent 70%)",
              }}
              aria-hidden
            />
          )}
        </>
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
