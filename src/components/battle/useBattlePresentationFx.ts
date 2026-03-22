"use client";

import { useCallback, useRef, useState } from "react";
import type { BattleFx, ExplosionHue, ItemBurst, StrikeAccent } from "@/components/battle/battle-fx-types";
import { dodgeMotionClass } from "@/components/battle/battle-fx-types";

export type BeamSide = "none" | "player" | "enemy";

export type BattleArenaFxSnapshot = {
  shake: "none" | "player" | "enemy";
  flash: "none" | "hit" | "crit";
  beam: BeamSide;
  beamMiss: boolean;
  beamKey: number;
  dodgeDance: "none" | "player" | "enemy";
  dodgeMotionClassName: string;
  explosionFlash: boolean;
  explosionHue: ExplosionHue;
  strikeAccentKey: number;
  strikeAccent: StrikeAccent | "none";
  accentVictim: "player" | "enemy" | "none";
  itemSparkKey: number;
  itemBurst: ItemBurst;
};

const defaultExplosionHue: ExplosionHue = "thermal";
const defaultItemBurst: ItemBurst = "cyan";

/**
 * 战斗区动效状态与 playBattleFx。
 * 互斥优先级：光束/闪白/大爆炸为短时覆盖；受击 accent 在 victim 侧叠加。
 */
export function useBattlePresentationFx({
  reducedMotion,
  reduceMotionPreferred,
}: {
  reducedMotion: boolean;
  reduceMotionPreferred: boolean | null;
}) {
  const [shake, setShake] = useState<BattleArenaFxSnapshot["shake"]>("none");
  const [flash, setFlash] = useState<BattleArenaFxSnapshot["flash"]>("none");
  const [beam, setBeam] = useState<BeamSide>("none");
  const [beamMiss, setBeamMiss] = useState(false);
  const [beamKey, setBeamKey] = useState(0);
  const [dodgeDance, setDodgeDance] = useState<"none" | "player" | "enemy">("none");
  const [dodgeMotionClassName, setDodgeMotionClassName] = useState("animate-battle-dodge");
  const [explosionFlash, setExplosionFlash] = useState(false);
  const [explosionHue, setExplosionHue] = useState<ExplosionHue>(defaultExplosionHue);
  const [strikeAccentKey, setStrikeAccentKey] = useState(0);
  const [strikeAccent, setStrikeAccent] = useState<StrikeAccent | "none">("none");
  const [accentVictim, setAccentVictim] = useState<"player" | "enemy" | "none">("none");
  const [itemSparkKey, setItemSparkKey] = useState(0);
  const [itemBurst, setItemBurst] = useState<ItemBurst>(defaultItemBurst);
  const accentClearTimerRef = useRef<number | null>(null);

  const clearStrikeAccentSoon = useCallback((ms: number) => {
    if (accentClearTimerRef.current != null) {
      window.clearTimeout(accentClearTimerRef.current);
      accentClearTimerRef.current = null;
    }
    accentClearTimerRef.current = window.setTimeout(() => {
      accentClearTimerRef.current = null;
      setStrikeAccent("none");
      setAccentVictim("none");
    }, ms);
  }, []);

  const playBattleFx = useCallback(
    (fx: BattleFx) => {
      if (accentClearTimerRef.current != null) {
        window.clearTimeout(accentClearTimerRef.current);
        accentClearTimerRef.current = null;
      }
      setDodgeDance("none");
      setStrikeAccent("none");
      setAccentVictim("none");

      if (fx.kind === "none") {
        return;
      }

      if (fx.kind === "item") {
        setItemBurst(fx.burst ?? defaultItemBurst);
        setItemSparkKey((k) => k + 1);
        return;
      }

      if (fx.kind === "explosion") {
        setExplosionHue(fx.hue ?? defaultExplosionHue);
        setExplosionFlash(true);
        window.setTimeout(
          () => setExplosionFlash(false),
          reducedMotion ? 120 : 420,
        );
        setShake("player");
        setFlash("hit");
        window.setTimeout(
          () => {
            setShake("none");
            setFlash("none");
          },
          reducedMotion ? 60 : 140,
        );
        return;
      }

      if (fx.kind === "dodge") {
        const dodger = fx.dodger;
        const attacker = dodger === "player" ? "enemy" : "player";
        setDodgeMotionClassName(dodgeMotionClass(fx.motion));
        if (reduceMotionPreferred !== true) {
          setBeam(attacker);
          setBeamMiss(true);
          setBeamKey((k) => k + 1);
          window.setTimeout(() => {
            setBeam("none");
            setBeamMiss(false);
          }, reducedMotion ? 100 : 280);
        }
        setShake("none");
        setFlash("none");
        setDodgeDance(dodger);
        window.setTimeout(() => setDodgeDance("none"), reducedMotion ? 100 : 340);
        return;
      }

      if (fx.kind === "strike") {
        const { attacker, crit, explosion } = fx;
        const victim = attacker === "player" ? "enemy" : "player";

        if (fx.accent) {
          setStrikeAccent(fx.accent);
          setAccentVictim(victim);
          setStrikeAccentKey((k) => k + 1);
          clearStrikeAccentSoon(reducedMotion ? 160 : 420);
        }

        if (reduceMotionPreferred !== true) {
          setBeam(attacker);
          setBeamMiss(false);
          setBeamKey((k) => k + 1);
          window.setTimeout(() => {
            setBeam("none");
            setBeamMiss(false);
          }, reducedMotion ? 120 : 450);
        }
        setShake(victim);
        setFlash(crit && attacker === "player" ? "crit" : "hit");
        if (explosion) {
          setExplosionHue(fx.hue ?? defaultExplosionHue);
          setExplosionFlash(true);
          window.setTimeout(
            () => setExplosionFlash(false),
            reducedMotion ? 120 : 400,
          );
        }
        window.setTimeout(
          () => {
            setShake("none");
            setFlash("none");
          },
          reducedMotion ? 80 : 220,
        );
      }
    },
    [reducedMotion, reduceMotionPreferred, clearStrikeAccentSoon],
  );

  const snapshot: BattleArenaFxSnapshot = {
    shake,
    flash,
    beam,
    beamMiss,
    beamKey,
    dodgeDance,
    dodgeMotionClassName,
    explosionFlash,
    explosionHue,
    strikeAccentKey,
    strikeAccent,
    accentVictim,
    itemSparkKey,
    itemBurst,
  };

  return { playBattleFx, fx: snapshot };
}
