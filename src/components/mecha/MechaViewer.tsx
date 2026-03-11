"use client";

import { AnimatePresence } from "framer-motion";
import {
  MechaGhost,
  ScatteredParts,
  Feet,
  Legs,
  Torso,
  LeftArm,
  RightArm,
  Head,
  PaintOverlay,
} from "./MechaParts";

interface MechaViewerProps {
  stage: number;
  className?: string;
}

export function MechaViewer({ stage, className }: MechaViewerProps) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 300"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="55%" r="40%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity={stage >= 3 ? 0.1 : 0} />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width="200" height="300" fill="url(#coreGlow)" />

        {/* Show ghost outline when not fully assembled */}
        {stage < 7 && <MechaGhost />}

        {/* Scattered parts when stage 0 */}
        {stage === 0 && <ScatteredParts />}

        <AnimatePresence>
          {stage >= 1 && <Feet key="feet" />}
          {stage >= 2 && <Legs key="legs" />}
          {stage >= 3 && <Torso key="torso" showCore={stage >= 3} />}
          {stage >= 4 && <LeftArm key="leftarm" />}
          {stage >= 5 && <RightArm key="rightarm" />}
          {stage >= 6 && <Head key="head" showEyes={stage >= 6} />}
          {stage >= 7 && <PaintOverlay key="paint" />}
        </AnimatePresence>
      </svg>
    </div>
  );
}
